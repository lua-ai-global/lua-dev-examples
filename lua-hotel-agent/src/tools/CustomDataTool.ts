import { LuaTool, Data } from "lua-cli";
import { z } from "zod";

// Movie data schema
export class CreateMovieTool implements LuaTool {
  name = "create_movie";
  description = "Add a new movie to the movies database";
  inputSchema = z.object({
    movie: z.object({
        title: z.string(),
        director: z.string(),
        year: z.number(),
        genre: z.array(z.string()),
        rating: z.number().min(0).max(10),
        duration: z.number(), // in minutes
        plot: z.string(),
        cast: z.array(z.string()),
        budget: z.number().optional(),
        boxOffice: z.number().optional(),
        imdbId: z.string().optional()
      }),
    searchText: z.string().optional().describe("Optional search text for better discoverability")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    return Data.create("movies", input.movie, input.searchText || `${input.movie.title} ${input.movie.director} ${input.movie.genre.join(' ')} ${input.movie.year}`);
  }
}

export class GetMoviesTool implements LuaTool {
  name = "get_movies";
  description = "Get movies from the database with optional filtering";
  inputSchema = z.object({
    filter: z.object({
      genre: z.string().optional().describe("Filter by genre (e.g., 'Action', 'Drama')"),
      year: z.number().optional().describe("Filter by release year"),
      director: z.string().optional().describe("Filter by director name"),
      minRating: z.number().min(0).max(10).optional().describe("Minimum rating filter"),
      maxRating: z.number().min(0).max(10).optional().describe("Maximum rating filter")
    }).optional(),
    page: z.number().min(1).default(1).describe("Page number for pagination"),
    limit: z.number().min(1).max(100).default(10).describe("Number of movies per page")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    return Data.get("movies", input.filter, input.page, input.limit);
  }
}

export class GetMovieByIdTool implements LuaTool {
  name = "get_movie_by_id";
  description = "Get a specific movie by its ID";
  inputSchema = z.object({
    movieId: z.string().describe("The unique ID of the movie to retrieve")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    return Data.getEntry("movies", input.movieId);
  }
}

export class UpdateMovieTool implements LuaTool {
  name = "update_movie";
  description = "Update an existing movie in the database";
  inputSchema = z.object({
    movieId: z.string().describe("The unique ID of the movie to update"),
    updates: z.object({
      title: z.string().optional(),
      director: z.string().optional(),
      year: z.number().optional(),
      genre: z.array(z.string()).optional(),
      rating: z.number().min(0).max(10).optional(),
      duration: z.number().optional(),
      plot: z.string().optional(),
      cast: z.array(z.string()).optional(),
      budget: z.number().optional(),
      boxOffice: z.number().optional(),
      imdbId: z.string().optional()
    }).describe("Movie fields to update"),
    searchText: z.string().optional().describe("Updated search text for better discoverability")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    const updateData: any = { data: input.updates };
    if (input.searchText) {
      updateData.searchText = input.searchText;
    }
    return Data.update("movies", input.movieId, updateData);
  }
}

export class SearchMoviesTool implements LuaTool {
  name = "search_movies";
  description = "Search movies by text (title, director, genre, plot, cast, etc.)";
  inputSchema = z.object({
    searchText: z.string().describe("Text to search for in movie titles, directors, genres, plot, cast, etc."),
    limit: z.number().min(1).max(50).default(10).describe("Maximum number of results to return"),
    scoreThreshold: z.number().min(0).max(1).default(0.3).describe("Minimum similarity score (0-1)")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    return Data.search("movies", input.searchText, input.limit, input.scoreThreshold);
  }
}

export class DeleteMovieTool implements LuaTool {
  name = "delete_movie";
  description = "Delete a movie from the database";
  inputSchema = z.object({
    movieId: z.string().describe("The unique ID of the movie to delete")
  });
  async execute(input: z.infer<typeof this.inputSchema>) {
    return Data.delete("movies", input.movieId);
  }
}