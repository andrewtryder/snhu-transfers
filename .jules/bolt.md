## 2024-07-03 - [Pre-computed Search Strings in React]
**Learning:** Pre-computing a single concatenated lowercase `searchString` for objects in a large array mapped for UI search filtering avoids running `.toLowerCase()` multiple times on every keystroke, which speeds up search filtering performance. Combined with `useDeferredValue`, this optimization significantly reduces UI freezing on large datasets.
**Action:** When filtering objects client-side by multiple text properties, look for opportunities to compute a combined search string once, particularly in `useMemo` hooks mapping raw data.
