import type { ReactNode } from "react"
import introImage from "@/assets/imgs/intropic.webp"

// Split auth screen: photo with tagline on the left half, form centered in the
// right half, inside a frame centered on the page. Stacks full screen with a
// short photo strip on narrow screens.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EFEAE0] md:p-8">
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-ivory text-ink md:h-[min(820px,92vh)] md:min-h-0 md:max-w-[1330px] md:flex-row md:rounded-2xl md:shadow-lg">
      <div className="relative h-60 shrink-0 md:h-auto md:flex-1">
        <img
          src={introImage}
          alt="Two people strength training outdoors against a white wall"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-x-4 bottom-4 mx-auto max-w-sm rounded-2xl bg-black/80 p-5 text-center text-ivory md:bottom-8 md:max-w-md">
          <p className="font-serif text-2xl font-semibold leading-tight">
            Your trainer, built around you
          </p>
          <p className="mt-1 text-sm text-[#CFC6B4]">
            Training and nutrition that adapt as you progress.
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-y-auto px-4 py-12 md:px-10 md:py-8">
        <div className="m-auto flex w-full max-w-sm flex-col gap-6">{children}</div>
      </div>
    </div>
    </div>
  )
}

export function Brand() {
  return (
    <a href="/" className="flex items-center gap-2.5 text-ink no-underline">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-ink font-serif text-lg font-semibold text-ivory"
      >
        A
      </span>
      <span className="font-serif text-xl font-semibold">Aitrainer</span>
    </a>
  )
}

export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-[0.12em] text-taupe">{eyebrow}</span>
      <h1 className="font-serif text-4xl font-semibold leading-tight">{title}</h1>
      <p className="text-taupe">{subtitle}</p>
    </div>
  )
}
