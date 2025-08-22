import Image from "next/image";

const logos = [
  {
    src: "/logos/TCF_logo.webp",
    alt: "The Cropper Foundation Logo",
    name: "The Cropper Foundation"
  },
  {
    src: "/logos/VA_logo.jpg",
    alt: "VA Logo",
    name: "Veni Apwann"
  },

  {
    src: "/logos/EU_logo.png",
    alt: "European Union Logo",
    name: "European Union"
  },
  {
    src: "/logos/SCA_logo.png",
    alt: "SCA Logo",
    name: "SwiftCo Analytics"
  }
];

interface LogosProps {
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: "footer" | "about";
}

export default function Logos({ title, subtitle, className = "", variant = "about" }: LogosProps) {
  const isFooter = variant === "footer";
  
  return (
    <div className={`${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <h3 className={`font-semibold text-gray-900 mb-2 ${isFooter ? 'text-sm' : 'text-lg'}`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`text-gray-600 ${isFooter ? 'text-xs' : 'text-sm'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isFooter ? 'max-w-2xl mx-auto' : ''}`}>
        {logos.map((logo, index) => (
          <div
            key={index}
            className={`flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 ${
              isFooter ? 'h-30' : 'h-30'
            }`}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={isFooter ? 100 : 100}
              height={isFooter ? 100 : 100}
              className="max-w-full max-h-full object-contain"
              title={logo.name}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
} 