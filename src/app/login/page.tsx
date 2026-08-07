import { LoginForm } from "@/components/login-form";
import { publicEnv } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const appName = publicEnv.appName;

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{appName}</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to buy tickets or create music events on Band Guru.
        </p>
      </div>
      {params.error ? (
        <p className="text-sm text-destructive" role="alert">
          {params.error}
        </p>
      ) : null}
      <LoginForm nextPath={params.next || "/"} />
    </div>
  );
}
