
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import introBannerimg from "@/assets/imgs/intropic.webp";

export default function imageBanner() {
  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <div className="flex flex-col gap-6">
            <img src={introBannerimg} alt="Aitrainer" className="w-full h-auto rounded-lg" />
        </div>
      </CardContent>


      <CardFooter className="flex-col gap-2">
        <CardTitle>Your trainer, built around you</CardTitle>
        <CardDescription>
          Training and nutrition that adapt as you progress.
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
