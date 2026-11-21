"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/toggle";
import { Field, FormError } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";
import { loginSchema } from "@/lib/validators";

type FormValues = z.infer<typeof loginSchema>;

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: FormValues) {
    setFormError(undefined);
    try {
      const result = await apiRequest<{ redirectTo: string }>("/api/auth/login", {
        method: "POST",
        body: values,
      });
      router.push(next && next.startsWith("/") ? next : result.redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) {
        setFormError(error.message);
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field === "email" || field === "password") {
            form.setError(field, { message });
          }
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormError message={formError} />

      <Field label="Email address" htmlFor="email" error={form.formState.errors.email?.message} required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message} required>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(form.formState.errors.password)}
            className="pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-500">
          <Checkbox
            checked={form.watch("remember") ?? true}
            onCheckedChange={(checked) => form.setValue("remember", Boolean(checked))}
          />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Spinner /> : null}
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <div className="rounded-xl bg-sand-50 p-3 text-[12px] leading-5 text-ink-500">
        <p className="font-semibold text-ink-700">Demo accounts (seeded)</p>
        <p>Family · sarah@carenest.dev</p>
        <p>Caregiver · amelia@carenest.dev</p>
        <p>Agency · agency@carenest.dev</p>
        <p>Admin · admin@carenest.dev</p>
        <p className="mt-1">Password: Password123!</p>
      </div>
    </form>
  );
}
