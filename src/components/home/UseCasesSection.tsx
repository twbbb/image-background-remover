import { ShoppingCart, User, Camera, ImageIcon } from "lucide-react";

const useCases = [
  {
    icon: ShoppingCart,
    title: "E-Commerce & Product Photos",
    description:
      "Create professional product photos with white or custom backgrounds for Amazon, Shopify, eBay, and more.",
  },
  {
    icon: User,
    title: "Portraits & Profile Pictures",
    description:
      "Remove backgrounds from portraits for LinkedIn, resumes, ID photos, and social media profiles.",
  },
  {
    icon: Camera,
    title: "Photography & Design",
    description:
      "Quickly isolate subjects from photos for compositing, collages, and graphic design projects.",
  },
  {
    icon: ImageIcon,
    title: "Social Media Content",
    description:
      "Create eye-catching social media posts with transparent or custom backgrounds for Instagram, TikTok, and more.",
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Perfect for Every Use Case
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            From e-commerce to social media — remove backgrounds for any
            purpose.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {useCases.map((uc) => (
            <div
              key={uc.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <uc.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{uc.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {uc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
