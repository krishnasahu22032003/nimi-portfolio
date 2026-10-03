export default function IntroSection() {
  return (
    <section
      className="
        mt-40
        bg-white
        px-5
        pb-16
        sm:px-8
        sm:pb-20
        md:px-12
        md:pb-24
        lg:px-16
        lg:pb-28
        xl:px-20
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1180px]
          rounded-[32px]
          bg-[#EDF5FF]
          px-7
          py-10
          sm:rounded-[34px]
          sm:px-10
          sm:py-12
          lg:rounded-[36px]
          lg:px-10
          lg:pb-[156px]
          lg:pt-8
        "
      >
        {/* ---------- Intro line: 24 / #555252 / Regular ---------- */}
        <p
          className="
            m-0
            w-fit
            max-w-full
            text-[20px]
            font-normal
            leading-[1.4]
            tracking-normal
            text-[#555252]
            sm:text-[22px]
            md:text-[24px]
            md:leading-[1.38]
          "
        >
          {/* Line 1 sets the width */}
          <span className="lg:block lg:whitespace-nowrap">
            I’m an industrial designer specialising in furniture design,
          </span>{" "}
          {/* Line 2: three groups spread to the same right edge as line 1 */}
          <span className="lg:flex lg:justify-between lg:whitespace-nowrap">
            <span>working across furniture,</span>{" "}
            <span>objects, and</span>{" "}
            <span>experiences.</span>
          </span>
        </p>

        <div className="mt-24 sm:mt-28 md:mt-32 lg:mt-[116px]">
          {/* ---------- Statement: 24 / #000000 / Medium ---------- */}
          <h2
            className="
              m-0
              w-fit
              max-w-full
              text-[20px]
              font-medium
              leading-[1.4]
              tracking-normal
              text-black
              sm:text-[22px]
              md:text-[24px]
              md:leading-[1.38]
            "
          >
            {/* Line 1 sets the width */}
            <span className="lg:block lg:whitespace-nowrap">
              MAKING PEOPLE SMILE THROUGH WHAT I CREATE IS WHAT MOVES ME.
            </span>{" "}
            {/* Line 2: the red gaps. Ends flush with line 1 ("ME." / "EXPERIENCE") */}
            <span className="lg:flex lg:justify-between lg:whitespace-nowrap">
              <span>WHETHER IT IS</span>{" "}
              <span>A FEELING,</span>{" "}
              <span>A CONNECTION,</span>{" "}
              <span>OR AN EXPERIENCE</span>
            </span>{" "}
            <span className="lg:block">THAT STAYS WITH THEM.</span>
          </h2>

          {/* ---------- Supporting text: 16 / #555252 / Regular, 3 fixed lines ---------- */}
          <p
            className="
              mb-0
              mt-4
              text-[15px]
              font-normal
              leading-[1.4]
              tracking-normal
              text-[#555252]
              sm:text-[16px]
              lg:mt-[10px]
            "
          >
            <span className="sm:block">
              Storytelling, metaphor, research, and strategy
            </span>{" "}
            <span className="sm:block">
              shape the way I approach design, giving ideas
            </span>{" "}
            <span className="sm:block">direction and form.</span>
          </p>
        </div>
      </div>
    </section>
  );
}