import { useState } from "react";

import { floors } from "@/constants/floors";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MobileFloorPlans() {
  const [isGif, setIsGif] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState("ground");

  const currentFloor =
    floors.find((floor) => floor.id === selectedFloor) || floors[0];

  function handleToggleIsGif() {
    setIsGif((prev) => !prev);
  }

  return (
    <div className="space-y-4">
      <Select
        value={selectedFloor}
        onValueChange={(val) => {
          if (val) setSelectedFloor(val);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select floor">
            {currentFloor.title}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {floors.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              {floor.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="animate-in fade-in-50">
        <p className="text-foreground/70 mb-4 text-center text-xs">
          Tap the image to {isGif ? "hide" : "show"} evacuation arrows
        </p>
        <button
          className="relative mx-auto aspect-video w-full cursor-pointer overflow-hidden rounded-md"
          onClick={handleToggleIsGif}
        >
          <img
            src={isGif ? currentFloor.gifSrc : currentFloor.imageSrc}
            alt={`${currentFloor.title} Earthquake Evacuation Plan`}
            width={1280}
            height={720}
            className="object-contain"
          />
        </button>
        {isGif && (
          <div className="grid gap-2">
            <p className="text-destructive text-center text-xs font-semibold">
              Emergency Exit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
