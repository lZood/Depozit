import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase URL or Service Role Key.' },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, password, role } = await request.json();

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, password, and role are required.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });
    
    if (createError) {
        console.error("Error creating user in Supabase Auth:", createError.message);
        return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser || !newUser.user) {
         return NextResponse.json({ error: "Could not create user account." }, { status: 500 });
    }

    // FIX: Use the supabaseAdmin client to insert the profile, bypassing RLS.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUser.user.id, role: role });

    if (profileError) {
      console.error("Error creating profile:", profileError.message);
      // If profile creation fails, it's best to delete the auth user to avoid orphans
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully', user: newUser.user });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
