"use client";
import { useSearchParams } from "next/navigation";
import YouTube from "react-youtube";

export default function Play() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get("v") || "eeZzCoghZzw";

    function scaleWidthAndHeight(factor: number) {
        return { height: 390 * factor, width: 640 * factor };
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <YouTube videoId={videoId} opts={scaleWidthAndHeight(2)} />
        </div>
    );
}
