export function useRouter() {
  return {
    push(path: string) {
      document.documentElement.dataset.navigatedTo = path
    },
    refresh() {
      document.documentElement.dataset.refreshed = "true"
    },
  }
}
