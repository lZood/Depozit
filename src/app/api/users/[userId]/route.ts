
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Corrected the environment variable name from SUPABASE_SERVICE_ROLE_KEY
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;

// This function handles PATCH requests to update a user's password.
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

  // Check if the current user is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { password } = await request.json();
  const userIdToUpdate = params.userId;

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userIdToUpdate,
      { password: password }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
  }
}


// This function handles DELETE requests to remove a user.
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
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

    const userIdToDelete = params.userId;

    if (userIdToDelete === user.id) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    try {
      const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
          },
      });

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

      if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'User deleted successfully' });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
    }
}
