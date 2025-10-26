export interface WeatherData {
    weather: string;
    city: string;
    temperature?: number;
    humidity?: number;
    description?: string;
}

export default class GetWeatherService {
    // Mock weather data - in a real app, this would call a weather API
    weatherData: Record<string, WeatherData>;

    constructor() {
        this.weatherData = {
            "london": { weather: "cloudy", city: "London", temperature: 15, humidity: 80, description: "Overcast with light rain" },
            "paris": { weather: "sunny", city: "Paris", temperature: 22, humidity: 60, description: "Clear skies" },
            "tokyo": { weather: "rainy", city: "Tokyo", temperature: 18, humidity: 85, description: "Heavy rainfall" },
            "new york": { weather: "sunny", city: "New York", temperature: 25, humidity: 55, description: "Partly cloudy" },
            "sydney": { weather: "sunny", city: "Sydney", temperature: 28, humidity: 45, description: "Clear and warm" }
        };
    }

    async getWeather(city: string): Promise<WeatherData> {
        const normalizedCity = city.toLowerCase().trim();
        
        // Return cached data if available, otherwise return generic response
        const weatherInfo = this.weatherData[normalizedCity] || {
            weather: "unknown",
            city: city,
            temperature: 20,
            humidity: 50,
            description: "Weather data not available"
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return weatherInfo;
    }
}