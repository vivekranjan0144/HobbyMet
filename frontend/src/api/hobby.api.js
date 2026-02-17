import fetcher from "../utils/fetch";

export const getCategories = async () => {
  const res = await fetcher.get("/hobby/categories");
  return res.data;
};

export const getHobbiesByCategory = async (categorySlug) => {
  const res = await fetcher.get(`/hobby/hobbies?category=${categorySlug}`);
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.hobbies)) return data.hobbies;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};
