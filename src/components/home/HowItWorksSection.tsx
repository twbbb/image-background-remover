export default function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Upload Your Image",
      description:
        "Drag & drop or click to upload any PNG, JPG, or WebP image.",
    },
    {
      step: "2",
      title: "AI Removes Background",
      description:
        "Our AI model processes the image right in your browser — fast and private.",
    },
    {
      step: "3",
      title: "Download Result",
      description:
        "Get a transparent PNG or choose a new background color. Download in full HD.",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            How to Remove Background from Image
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Three simple steps to remove any image background — completely free.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-xl font-bold mb-4">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
