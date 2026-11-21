"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/toggle";
import { Field, FormError } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";
import { registerSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof registerSchema>;
type Role = "family" | "caregiver" | "agency";

const ROLE_OPTIONS: { value: Role; label: string; description: string; icon: typeof Users }[] = [
  {
    value: "family",
    label: "I need care",
    description: "Post jobs and hire a caregiver for your family.",
    icon: Users,
  },
  {
    value: "caregiver",
    label: "I provide care",
    description: "Build a profile and apply for care jobs.",
    icon: Briefcase,
  },
  {
    value: "agency",
    label: "I run an agency",
    description: "Manage a roster of caregivers and placements.",
    icon: Building2,
  },
];

export function RegisterForm({ initialRole }: { initialRole?: Role }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole ?? "family",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      agencyName: "",
      acceptTerms: undefined as unknown as true,
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: FormValues) {
    setFormError(undefined);
    try {
      const result = await apiRequest<{ redirectTo: string }>("/api/auth/register", {
        method: "POST",
        body: values,
      });
      router.push(result.redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) {
        setFormError(error.message);
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          form.setError(field as keyof FormValues, { message });
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">I am joining as</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => form.setValue("role", option.value, { shouldValidate: true })}
                aria-pressed={selected}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-white hover:border-primary/40"
                )}
              >
                <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-ink-500")} />
                <p className="mt-2 text-sm font-semibold">{option.label}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
        {form.formState.errors.role ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.role.message}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" error={form.formState.errors.firstName?.message} required>
          <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={form.formState.errors.lastName?.message} required>
          <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
        </Field>
      </div>

      {role === "agency" ? (
        <Field
          label="Agency name"
          htmlFor="agencyName"
          error={form.formState.errors.agencyName?.message}
          required
        >
          <Input id="agencyName" placeholder="Nest & Nurture Agency" {...form.register("agencyName")} />
        </Field>
      ) : null}

      <Field label="Email address" htmlFor="email" error={form.formState.errors.email?.message} required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message} required hint="8+ characters, one number">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        </Field>
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={form.formState.errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={form.formState.errors.city?.message} required className="sm:col-span-1">
          <Input id="city" autoComplete="address-level2" {...form.register("city")} />
        </Field>
        <Field label="State" htmlFor="state" error={form.formState.errors.state?.message} required>
          <Input id="state" autoComplete="address-level1" {...form.register("state")} />
        </Field>
        <Field label="ZIP code" htmlFor="zip" error={form.formState.errors.zip?.message} required>
          <Input id="zip" autoComplete="postal-code" {...form.register("zip")} />
        </Field>
      </div>

      <Field label="Phone (optional)" htmlFor="phone" error={form.formState.errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" {...form.register("phone")} />
      </Field>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-500">
          <Checkbox
            className="mt-0.5"
            checked={Boolean(form.watch("acceptTerms"))}
            onCheckedChange={(checked) =>
              form.setValue("acceptTerms", (checked ? true : undefined) as true, {
                shouldValidate: true,
              })
            }
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {form.formState.errors.acceptTerms ? (
          <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Spinner /> : null}
        {form.formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
