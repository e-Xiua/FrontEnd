import { Route } from "../models/route";
import { usuarios } from "../models/usuarios";


// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Function to group providers into routes
export function createMockRoutes(providers: usuarios[], providersPerRoute: number = 3): Route[] {
  const shuffledProviders = shuffleArray([...providers]);
  const routes: Route[] = [];
  let routeId = 1;

  for (let i = 0; i < shuffledProviders.length; i += providersPerRoute) {
    const routeProviders = shuffledProviders.slice(i, i + providersPerRoute);
    if (routeProviders.length === 0) break;

    routes.push({
      id: `route-${routeId}`,
      name: `Route ${routeId}`,
      description: `Explore a curated selection of providers for Route ${routeId}`,
      category: ['Adventure', 'Cultural', 'Nature'][Math.floor(Math.random() * 3)],
      duration: `${Math.floor(Math.random() * 5) + 1} hours`,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      estimatedTime: Math.floor(Math.random() * 300) + 60, // 1–5 hours in minutes
      estimatedDistance: Math.floor(Math.random() * 50) + 5, // 5–55 km
      providers: routeProviders,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      icon: 'map-pin',
      tags: ['travel', 'tour', routeProviders[0]?.nombre || 'general'],
      startLocation: [10.501 + (Math.random() * 0.05), -84.697 + (Math.random() * 0.05)],
      endLocation: [10.501 + (Math.random() * 0.05), -84.697 + (Math.random() * 0.05)],
      isActive: true,
      createdAt: new Date(),
      rating: Math.random() * 2 + 3, // 3–5 stars
      totalReviews: Math.floor(Math.random() * 100),
    });
    routeId++;
  }

  return routes;
}
