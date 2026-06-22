import { BGPattern } from "@/components/ui/bg-pattern";

export default function BGPatternDemo() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-8">
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-edges" variant="grid" />
        <h2 className="text-3xl font-bold">Grid Background</h2>
        <p className="font-mono text-muted-foreground">With (fade-edges) Mask</p>
      </div>
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-center" variant="dots" />
        <h2 className="text-3xl font-bold">Dots Background</h2>
        <p className="font-mono text-muted-foreground">With (fade-center) Mask</p>
      </div>
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-y" variant="diagonal-stripes" />
        <h2 className="text-3xl font-bold">Diagonal Stripes</h2>
        <p className="font-mono text-muted-foreground">With (fade-y) Mask</p>
      </div>
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-right" variant="horizontal-lines" />
        <h2 className="text-3xl font-bold">Horizontal Lines</h2>
        <p className="font-mono text-muted-foreground">With (fade-right) Mask</p>
      </div>
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-bottom" variant="vertical-lines" />
        <h2 className="text-3xl font-bold">Vertical Lines</h2>
        <p className="font-mono text-muted-foreground">With (fade-bottom) Mask</p>
      </div>
      <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border-2">
        <BGPattern mask="fade-top" variant="checkerboard" />
        <h2 className="text-3xl font-bold">Checkerboard Background</h2>
        <p className="font-mono text-muted-foreground">With (fade-top) Mask</p>
      </div>
    </div>
  );
}
