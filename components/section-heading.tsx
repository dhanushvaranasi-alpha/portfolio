type SectionHeadingProps = {
  index: string;
  label: string;
  title: string;
};

export default function SectionHeading({
  index,
  label,
  title,
}: SectionHeadingProps) {
  return (
    <div className="mb-12">
      <p className="text-accent font-mono text-sm tracking-[0.25em] uppercase">
        {index} / {label}
      </p>
      <h2 className="font-heading mt-3 text-4xl font-medium md:text-5xl">
        {title}
      </h2>
    </div>
  );
}
