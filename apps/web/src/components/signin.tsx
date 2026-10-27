import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeading, AuthLayout, Brand } from "@/components/authLayout"

export function SignIn() {
  return (
    <AuthLayout>
      <Brand />
      <AuthHeading
        eyebrow="WELCOME BACK"
        title="Continue your plan"
        subtitle="Log in to see today's workout."
      />

      <form noValidate className="flex w-full flex-col gap-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signin-email">Email address</FieldLabel>
            <Input id="signin-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-12 bg-white" />
          </Field>

          <Field>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel htmlFor="signin-password">Password</FieldLabel>
              <a href="/forgot-password" className="text-sm font-medium text-gold hover:text-gold-dark">
                Forgot your password?
              </a>
            </div>
            <Input id="signin-password" type="password" autoComplete="current-password" className="h-12 bg-white" />
          </Field>

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" className="size-4 accent-gold" />
            Keep me logged in
          </label>

          <Button type="submit" className="h-12 w-full rounded-full bg-gold text-base text-white hover:bg-gold-dark">
            Log in
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-taupe">
        New to Aitrainer?{" "}
        <a href="/sign-up" className="font-semibold text-gold hover:text-gold-dark">
          Create an account
        </a>
      </p>
      <p className="-mt-3 text-center text-sm text-taupe">Private by design. You control your data.</p>
    </AuthLayout>
  )
}
