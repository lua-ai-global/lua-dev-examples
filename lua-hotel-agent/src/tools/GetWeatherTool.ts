import { LuaTool } from "lua-cli/skill";
import { z } from "zod";

export default class GetWeatherTool implements LuaTool {
    name = "get_weather";
    description = "Get the weather for a given city";
    inputSchema = z.object({
        city: z.string()
    });
    outputSchema = z.object({
        weather: z.string(),
        city: z.string(),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        description: z.string().optional()
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        // Step 1: Geocode city → lat/lon (use Open-Meteo’s free geocoding API)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            input.city
        )}&count=1`;
        
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            throw new Error(`Failed to fetch location: ${geoRes.statusText}`);
        }
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`No location found for ${input.city}`);
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Step 2: Get weather for lat/lon
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            throw new Error(`Failed to fetch weather: ${weatherRes.statusText}`);
        }
        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;

        return {
            weather: current.weathercode?.toString() || "Unknown",
            city: name,
            temperature: current.temperature,
            humidity: undefined, // Open-Meteo current_weather does not include humidity
            description: `Windspeed ${current.windspeed} km/h`
        };
    }
}
