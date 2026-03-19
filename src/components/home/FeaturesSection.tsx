import {
  Zap,
  Shield,
  Sparkles,
  Monitor,
  Layers,
  Download,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Remove backgrounds in seconds, not minutes. Our AI processes images right in your browser.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "100% Private",
    description:
      "Your images never leave your device. All processing happens locally in your browser.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Precision",
    description:
      "Advanced AI model handles complex edges — hair, fur, transparent objects with ease.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Monitor,
    title: "Works Everywhere",
    description:
      "No downloads, no installs. Works on any modern browser — desktop, tablet, or mobile.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Layers,
    title: "Background Replace",
    description:
      "Not just removal — add solid colors or custom background images to your photos.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Download,
    title: "HD Download",
    description:
      "Download full-resolution PNG images with transparent backgrounds. No quality loss.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Why Choose <span className="gradient-text">BGRemover</span>?
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            The most powerful free background remover. No watermarks, no limits,
            no signups.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
