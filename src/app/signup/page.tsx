import SignupForm from "@/features/auth/components/SignupForm";

interface SignupPageProps {
  searchParams?: Promise<{
    email?: string;
    provider?: string;
    providerId?: string;
    nickname?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const socialProvider = params.provider && params.provider !== "false" ? params.provider : undefined;
  const isSocialSignup = !!socialProvider;

  return (
    <SignupForm
      key={isSocialSignup ? `social-signup-${socialProvider}` : "default-signup"}
      isSocialSignup={isSocialSignup}
      socialSignupData={
        isSocialSignup
          ? {
              email: params.email ?? "",
              provider: socialProvider ?? "",
              providerId: params.providerId ?? "",
              nickname: params.nickname ?? "",
            }
          : undefined
      }
    />
  );
}
