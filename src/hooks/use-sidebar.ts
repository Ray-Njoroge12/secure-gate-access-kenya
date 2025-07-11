import * as React from "react"
import { SidebarContext } from "@/components/ui/sidebar"

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

export { useSidebar }
