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
          md:px-12
          md:py-14
          lg:rounded-[36px]
          lg:px-12
          lg:py-14
          xl:px-[49px]
          xl:py-[47px]
        "
      >
        <div className="max-w-[780px]">
          <p
            className="
              m-0
              text-[20px]
              leading-[1.45]
              font-normal
              tracking-[-0.015em]
              text-[#555252]
              sm:text-[22px]
              md:text-[24px]
              md:leading-[1.4]
            "
          >
            I’m an industrial designer specialising in furniture
            design, working across furniture, objects, and
            experiences.
          </p>
        </div>

        <div
          className="
            mt-24
            max-w-[1050px]
            sm:mt-28
            md:mt-32
            lg:mt-[145px]
          "
        >
          <h2
            className="
              m-0
              max-w-[1050px]
              text-[20px]
              leading-[1.4]
              font-medium
              tracking-[-0.025em]
              text-black
              sm:text-[22px]
              md:text-[24px]
              md:leading-[1.38]
            "
          >
            MAKING PEOPLE SMILE THROUGH WHAT I CREATE IS WHAT MOVES
            ME. WHETHER IT IS A FEELING, A CONNECTION, OR AN
            EXPERIENCE THAT STAYS WITH THEM.
          </h2>

          <p
            className="
              mt-5
              mb-0
              max-w-[430px]
              text-[15px]
              leading-[1.55]
              font-normal
              tracking-[-0.01em]
              text-[#555252]
              sm:text-[16px]
              md:mt-6
            "
          >
            Storytelling, metaphor, research, and strategy shape
            the way I approach design, giving ideas direction and
            form.
          </p>
        </div>
      </div>
    </section>
  );
}