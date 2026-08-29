import Image from "next/image";

interface RecipePhotoProps {
  src: string;
  alt: string;
}

function RecipePhoto({ src, alt }: RecipePhotoProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        loading="eager"
        className="object-cover"
      />
    </div>
  );
}

export default RecipePhoto;
