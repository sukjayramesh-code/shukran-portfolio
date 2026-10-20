// Where the achievements data lives.
//
// The site is static (GitHub Pages), so achievements are stored as a JSON file
// plus photos on a separate branch of a GitHub repo. Anyone can READ them
// (the repo is public); only someone holding a GitHub token with write access
// to this repo can ADD, EDIT or DELETE.
//
// Tip: for least privilege you can point this at a separate, empty repo
// (e.g. "shukran-portfolio-content") so the token can never touch the site code.

export const CONTENT_OWNER = "sukjayramesh-code";
export const CONTENT_REPO = "shukran-portfolio";
export const CONTENT_BRANCH = "content";

export const DATA_FILE = "achievements.json";
export const IMAGE_DIR = "achievements";

export const MAX_PHOTOS_PER_POST = 8;
