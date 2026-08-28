import ctaImage from "../assets/images/cta-community.jpg";
import Button from "../components/Button";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";
import { ROUTES } from "../lib/routes";

export default function CommunityCta() {
  return (
    <section className="bg-ivory px-5 pb-10 sm:px-8 sm:pb-12" aria-label="Join our community">
      <Reveal className="relative mx-auto max-w-[72rem] overflow-hidden rounded-[4px] bg-forest-900">
        <img
          src={ctaImage}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[52%] object-cover object-[70%_center] opacity-[0.18]"
          loading="lazy"
          width={1600}
          height={1066}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgb(12, 31, 19) 0%, rgba(12, 31, 19, 0.96) 46%, rgba(12, 31, 19, 0.88) 68%, rgba(12, 31, 19, 0.78) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-start justify-between gap-10 px-8 py-12 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:px-16 lg:py-16">
          <div className="max-w-xl">
            <span className="mb-4 block h-px w-10 bg-gold" aria-hidden="true" />
            <h2 className="font-display text-[2.15rem] font-semibold leading-[1.12] text-ivory sm:text-[2.6rem]">
              Be Part of Something Bigger
            </h2>
            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ivory/80">
              Join Bana Ba Sawa UK and help build a stronger, united and thriving community.
            </p>
            <div className="mt-8">
              <Button to={ROUTES.membership} variant="secondary">
                Join Our Community
              </Button>
            </div>
          </div>

          <div
            className="mx-auto flex h-36 w-36 shrink-0 items-center justify-center rounded-full border border-gold/45 sm:h-40 sm:w-40 lg:mx-0"
            aria-hidden="true"
          >
            <div className="flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-full border border-ivory/25 sm:h-32 sm:w-32">
              <Logo variant="light" className="h-16 w-16" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
