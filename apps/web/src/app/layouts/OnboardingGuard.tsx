import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { Spinner } from "../../components/ui/Spinner.js";

/**
 * Keeps first-time users in onboarding until they finish or skip.
 *
 * `expectCompleted` flips the direction: the app shell requires onboarding
 * to be done, while the onboarding route itself requires it *not* to be —
 * so a returning user can't get dropped back into the flow.
 */
export function OnboardingGuard({ expectCompleted }: { expectCompleted: boolean }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  // If the profile can't be loaded, don't trap the user in a redirect loop —
  // let the app render and surface its own error states.
  if (isError || !user) return <Outlet />;

  if (expectCompleted && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  if (!expectCompleted && user.onboardingCompleted) return <Navigate to="/app" replace />;

  return <Outlet />;
}
