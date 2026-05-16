"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  IconLogout,
  IconMoon,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react";
import { logoutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UploadedImage } from "@/domain/barq/types";
import { BarqImage } from "@/features/profile/barq-image";

export function UserMenu({
  displayName,
  image,
  username,
  uuid,
}: {
  displayName: string;
  image: UploadedImage | null;
  username: string | null;
  uuid: string;
}) {
  const { setTheme, theme } = useTheme();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Open account menu"
            className="overflow-hidden rounded-full border-border p-0"
            size="icon-lg"
            variant="outline"
          />
        }
      >
        {image ? (
          <BarqImage
            alt={`${displayName} profile image`}
            className="size-full object-cover"
            image={image}
            width={96}
          />
        ) : (
          <IconUserCircle className="size-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{displayName}</span>
            {username ? (
              <span className="block truncate font-normal text-muted-foreground">
                @{username}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/profiles/${uuid}`} />}>
          <IconUserCircle className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "dark" ? (
              <IconMoon className="size-4" />
            ) : (
              <IconSun className="size-4" />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme ?? "system"}
              onValueChange={setTheme}
            >
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          variant="destructive"
          onClick={() => {
            startTransition(async () => {
              await logoutAction();
            });
          }}
        >
          <IconLogout className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
