import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets/styles.css": "assets/styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/images": "assets/images" });
  eleventyConfig.addPassthroughCopy({ "src/files": "files" });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [400, 800, 1200, "auto"],
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
    },
  });

  eleventyConfig.addCollection("work", (api) =>
    api
      .getFilteredByGlob("src/work/*.md")
      .sort((a, b) => {
        const oa = a.data.order ?? 999;
        const ob = b.data.order ?? 999;
        if (oa !== ob) return oa - ob;
        return (b.date ?? 0) - (a.date ?? 0);
      })
  );

  eleventyConfig.addFilter("date", (value, fmt = "long") => {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return "";
    if (fmt === "year") return d.getFullYear().toString();
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  });

  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
