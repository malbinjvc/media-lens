<script lang="ts">
  import { page } from "$app/stores";
  import {
    LayoutDashboard,
    Image,
    FolderKanban,
    Search,
    Sparkles,
    LogOut,
  } from "lucide-svelte";
  import { auth } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/media", icon: Image, label: "Media Library" },
    { href: "/projects", icon: FolderKanban, label: "Projects" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/analyze", icon: Sparkles, label: "AI Analysis" },
  ];

  async function handleLogout() {
    await auth.logout();
    goto("/login");
  }
</script>

<aside class="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
  <div class="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
    <Sparkles class="h-6 w-6 text-primary-600" />
    <span class="text-xl font-bold text-primary-600">MediaLens</span>
  </div>

  <nav class="flex-1 space-y-1 px-3 py-4">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
          {$page.url.pathname === item.href
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
      >
        <svelte:component this={item.icon} class="h-5 w-5" />
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="border-t border-gray-200 p-3">
    <button
      onclick={handleLogout}
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
    >
      <LogOut class="h-5 w-5" />
      Sign Out
    </button>
  </div>
</aside>
