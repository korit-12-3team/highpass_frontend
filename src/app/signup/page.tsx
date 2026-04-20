import SignupForm from "@/features/auth/components/SignupForm";

interface SignupPageProps {
  searchParams?: Promise<{
    provider?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const isSocialSignup = params.provider === "true";

  return <SignupForm key={isSocialSignup ? "social-signup" : "default-signup"} isSocialSignup={isSocialSignup} />;
}
