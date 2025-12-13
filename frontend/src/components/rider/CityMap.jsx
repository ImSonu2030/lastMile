import React from "react";

export default function CityMap({
  stations,
  drivers,
  selectedStation,
  onSelectStation,
}) {
  return (
    <div className="md:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">
        City Map (Live)
      </h2>
      <div className="relative w-full aspect-square bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #4b5563 1px, transparent 1px)",
            ubackgroundSize: "10% 10%",
          }}
        ></div>

        {stations.map((station) => (
          <div
            key={station.id}
            onClick={() => onSelectStation(station)}
            className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all group
              ${
                selectedStation?.id === station.id
                  ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                  : "bg-blue-500"
              }`}
            style={{
              left: `${station.x_coordinate}%`,
              bottom: `${station.y_coordinate}%`,
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-black/70 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
              {station.name}
            </span>
          </div>
        ))}

        {drivers.map((driver) => (
          <div
            key={driver.driver_id}
            className="absolute transition-all duration-1000 ease-linear transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
            style={{
              left: `${driver.x_coordinate}%`,
              bottom: `${driver.y_coordinate}%`,
            }}
          >
            <span className="bg-gray-900/80 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 border border-gray-600 shadow-sm whitespace-nowrap">
              {driver.name || "Driver"}
            </span>

            <span className="text-2xl" title={`Status: ${driver.status}`}>
              🚖
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
