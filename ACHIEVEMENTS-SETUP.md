# Achievements section: setup

## 1. Add the files
Copy everything in this zip into your project, keeping the folder structure
(it overwrites `App.jsx`, `NavBar.jsx` and `SidebarNav.jsx`, and adds new files).
Then:

```sh
npm run dev      # check it locally
git add . && git commit -m "Add achievements" && git push   # Actions deploys it
```

## 2. Make your owner token (once, ~2 minutes)
1. GitHub -> profile picture -> **Settings** -> **Developer settings** ->
   **Personal access tokens** -> **Fine-grained tokens** -> **Generate new token**
2. Name: `portfolio achievements` · Expiration: 90 days (or custom)
3. **Repository access** -> *Only select repositories* -> `shukran-portfolio`
4. **Permissions** -> *Repository permissions* -> **Contents: Read and write**
5. Generate, then copy the token (starts with `github_pat_`). GitHub shows it once.

## 3. Post an achievement
1. Open your site, scroll to **/ achievements**, click the small **lock** icon.
2. Paste the token, click **Unlock**.
3. Click **Add achievement** -> pick photos, add a title, optional tag
   (e.g. "Gold Medal · 5th Place"), optional month, and a caption -> **Post**.

While logged in, every card has a pencil (edit) and a bin (delete).
Click a card (as anyone) to open the full-size photos and caption.

## Good to know
- **Only you can post.** Saving needs your token, and GitHub checks it on every
  save. Visitors can see the lock icon but can't do anything with it.
- Keep the token private. If it ever leaks, delete it under
  Settings -> Developer settings and make a new one.
- When the token expires, the site will ask you to log in again with a new one.
- Photos are resized to 1600 px and compressed automatically. The repo is
  public, so achievement photos are public too.
- The first post creates a `content` branch holding `achievements.json` and the
  photos. Posting never triggers a redeploy; visitors see new posts within about a minute.
- The two starter entries (FIYPROC, AeroMech) are saved along with your first
  post, after which you can edit or delete them like any other.
- Photos on an existing post can't be swapped. Delete the post and add it again.
- Optional: to keep the token away from your site code entirely, make an empty
  repo (e.g. `shukran-portfolio-content`), put its name in
  `src/config/contentRepo.js`, and give the token access to that repo only.
