import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeading, AuthLayout } from "@/components/authLayout"

export function ForgotPassword() {
  return (
    <AuthLayout>
      <a href="/login" className="flex min-h-11 items-center gap-1.5 font-medium text-gold hover:text-gold-dark">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to log in
      </a>

      <AuthHeading
        eyebrow="RESET PASSWORD"
        title="Forgot your password?"
        subtitle="Enter your email and we will send a reset link."
      />

      <form noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="reset-email">Email address</FieldLabel>
            <Input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-12 bg-white" />
          </Field>

          <Button type="submit" className="h-12 w-full rounded-full bg-gold text-base text-white hover:bg-gold-dark">
            Send reset link
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
