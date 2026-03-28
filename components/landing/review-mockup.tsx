import { Star } from "lucide-react";

export function ReviewMockup() {
  return (
    <div className="relative w-full max-w-md">
      <div
        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_25px_55px_-10px_rgba(39,174,96,0.15)]"
        aria-hidden
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[#0D0D0D]">Paystack</p>
            <p className="text-sm text-[#6B7280]">Product · Lagos</p>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="size-4 fill-[#F5A623] text-[#F5A623]"
                aria-hidden
              />
            ))}
            <Star className="size-4 text-[#E5E7EB]" aria-hidden />
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#0D0D0D]">
          Strong engineering culture and transparent leadership. Pace is fast but teams support each other. Remote
          flexibility has improved a lot.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#F7F8FA] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
            Career growth
          </span>
          <span className="rounded-full bg-[#F7F8FA] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
            Work–life balance
          </span>
        </div>
        <p className="mt-4 border-t border-[#E5E7EB] pt-3 text-xs text-[#6B7280]">
          Also browse: <span className="font-medium text-[#0D0D0D]">MTN</span>,{" "}
          <span className="font-medium text-[#0D0D0D]">Dangote</span>,{" "}
          <span className="font-medium text-[#0D0D0D]">Andela</span>, and more.
        </p>
      </div>

      <div className="absolute -right-2 top-1/2 hidden w-[min(100%,220px)] -translate-y-1/2 translate-x-[8%] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg sm:block lg:-right-8 lg:translate-x-[18%]">
        <p className="text-xs font-semibold text-[#0D0D0D]">Flutterwave</p>
        <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
          Great mission, busy quarters. Expect clear goals and lots of collaboration across teams.
        </p>
      </div>

      <div className="absolute -bottom-3 -left-2 hidden w-[min(100%,200px)] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-md sm:block lg:-left-6">
        <p className="text-xs font-semibold text-[#0D0D0D]">GTBank</p>
        <div className="mt-1 flex items-center gap-0.5">
          {[1, 2, 3].map((i) => (
            <Star key={i} className="size-3.5 fill-[#F5A623] text-[#F5A623]" />
          ))}
          {[1, 2].map((i) => (
            <Star key={`e-${i}`} className="size-3.5 text-[#E5E7EB]" />
          ))}
        </div>
      </div>
    </div>
  );
}
