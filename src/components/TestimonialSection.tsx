import testimonialPhoto from "@/assets/testimonial-photo.jpg";
import decorativeLeaf from "@/assets/decorative-leaf.png";

export const TestimonialSection = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary p-8 text-primary-foreground">
      <div className="max-w-md">
        <div className="relative mb-8 inline-block">
          <img
            src={testimonialPhoto}
            alt="Счастливая семья"
            className="h-80 w-80 rounded-full object-cover"
          />
          <img
            src={decorativeLeaf}
            alt=""
            className="absolute -bottom-4 -right-4 h-20 w-20"
          />
        </div>
        
        <blockquote className="space-y-6">
          <p className="text-lg leading-relaxed">
            "Little Otter изменил жизнь моей семьи. Все, с кем я общалась, были очень
            профессиональными, отзывчивыми и добрыми. Оба моих ребенка смогли получить
            качественную психологическую помощь, не выходя из дома, и у них обоих все
            отлично."
          </p>
          <footer className="text-sm opacity-90">
            -Мама, участница программы Little Otter
          </footer>
        </blockquote>
      </div>
    </div>
  );
};
