import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeading, AuthLayout, Brand } from "@/components/authLayout"

export function SignUp() {
  return (
    <AuthLayout>
      <Brand />
      <AuthHeading
        eyebrow="CREATE ACCOUNT"
        title="Start strong"
        subtitle="A few details and we'll build a plan around you."
      />

      <form noValidate className="flex w-full flex-col gap-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
            <Input id="signup-name" type="text" autoComplete="name" className="h-12 bg-white" />
          </Field>

          <Field>
            <FieldLabel htmlFor="signup-email">Email address</FieldLabel>
            <Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-12 bg-white" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input id="signup-password" type="password" autoComplete="new-password" className="h-12 bg-white" />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm">Confirm password</FieldLabel>
              <Input id="signup-confirm" type="password" autoComplete="new-password" className="h-12 bg-white" />
            </Field>
          </div>
          <FieldDescription className="-mt-3">At least 8 characters.</FieldDescription>

          <Button type="submit" className="h-12 w-full rounded-full bg-gold text-base text-white hover:bg-gold-dark">
            Create account
          </Button>
          <p className="text-center text-sm text-taupe">
            By continuing, you agree to the terms and privacy policy.
          </p>
        </FieldGroup>
      </form>

      <p className="text-center text-taupe">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-gold hover:text-gold-dark">
          Log in
        </a>
      </p>
    </AuthLayout>
  )
}
