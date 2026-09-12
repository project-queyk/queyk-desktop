import { cn } from "cn";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  MessageCircle,
  MessageCircleOff,
  MoreHorizontal,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";

import { getSession, useSession } from "@/lib/auth-client";
import type { ListUsersRow } from "../../../bindings/queyk/internal/adapters/postgresql/sqlc/models";
import {
  ListUsers,
  UpdateUserAlertNotification,
  UpdateUserSMSNotification,
  UpdateUserRole,
  DeleteUser,
} from "../../../bindings/queyk/internal/users/service";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_main/user-management")({
  beforeLoad: async () => {
    try {
      const { data } = await getSession();

      if (!data?.session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bearer_token");
        }
        throw redirect({ to: "/sign-in" });
      }

      if ((data.user as any)?.role !== "admin") {
        throw redirect({ to: "/evacuation-plan" });
      }

      return { user: data?.user };
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
      }
      throw redirect({ to: "/sign-in" });
    }
  },
  component: UserManagement,
});

function UserManagement() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [userToDelete, setUserToDelete] = useState<ListUsersRow | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "users",
      pagination.pageIndex + 1,
      pagination.pageSize,
      debouncedFilter,
    ],
    queryFn: async () => {
      return await ListUsers(
        debouncedFilter,
        pagination.pageIndex + 1,
        pagination.pageSize,
      );
    },
  });

  const toggleNotification = useMutation({
    mutationFn: async ({
      userId,
      currentValue,
    }: {
      userId: string;
      currentValue: boolean;
    }) => {
      return await UpdateUserAlertNotification(userId, !currentValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const toggleSMSNotification = useMutation({
    mutationFn: async ({
      userId,
      currentValue,
    }: {
      userId: string;
      currentValue: boolean;
    }) => {
      return await UpdateUserSMSNotification(userId, !currentValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: string;
    }) => {
      return await UpdateUserRole(userId, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await DeleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleCancelDelete = () => {
    setUserToDelete(null);
    setDeletingUserId(null);
  };

  const handleDeleteUser = async (user: ListUsersRow) => {
    const userId = typeof user.id === "string" ? user.id : String(user.id);
    if (deletingUserId) {
      return;
    }

    setDeletingUserId(userId);

    try {
      await deleteUserMutation.mutateAsync(userId);
      setUserToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const columns = useMemo<ColumnDef<ListUsersRow>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => {
          const profileImage = row.original.profile_image;
          const name = row.original.name;
          return (
            <div className="flex items-center gap-3">
              <div className="relative size-8 overflow-hidden rounded-full">
                <img
                  src={profileImage || "/placeholder-avatar.svg"}
                  alt={`${name}'s profile`}
                  className="size-full object-cover"
                />
              </div>
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.getValue("role") as string;
          const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                role === "admin"
                  ? ""
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
              style={
                role === "admin"
                  ? {
                      backgroundColor: "#ffd43b",
                      color: "#000000",
                    }
                  : undefined
              }
            >
              {displayRole}
            </span>
          );
        },
      },
      {
        accessorKey: "alert_notification",
        header: "Email Notifications",
        cell: ({ row }) => {
          const enabled = row.getValue("alert_notification") as boolean;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                enabled
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          );
        },
      },
      {
        accessorKey: "sms_notification",
        header: "SMS Notifications",
        cell: ({ row }) => {
          const enabled = row.getValue("sms_notification") as boolean;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                enabled
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        cell: ({ row }) => {
          const rawDate = row.getValue("created_at");
          if (!rawDate) return null;
          const date = new Date(rawDate as string);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const currentUserEmail = session?.user?.email;

          if (user.email === currentUserEmail) {
            return null;
          }

          const userId =
            typeof user.id === "string" ? user.id : String(user.id);
          const rawPhone =
            typeof user.phone_number === "string"
              ? user.phone_number
              : (user.phone_number as any)?.String || "";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-8 cursor-pointer",
                )}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={6}
                className="w-56"
              >
                <DropdownMenuItem
                  onClick={() => {
                    const newRole = user.role === "admin" ? "user" : "admin";
                    updateRole.mutate({ userId, newRole });
                  }}
                >
                  <UserCheck className="mr-2 size-4" />
                  Switch to {user.role === "admin" ? "User" : "Admin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toggleNotification.mutate({
                      userId,
                      currentValue: user.alert_notification,
                    });
                  }}
                >
                  {user.alert_notification ? (
                    <BellOff className="mr-2 size-4" />
                  ) : (
                    <Bell className="mr-2 size-4" />
                  )}
                  {user.alert_notification ? "Disable" : "Enable"} Notifications
                </DropdownMenuItem>
                {rawPhone ? (
                  <DropdownMenuItem
                    onClick={() => {
                      toggleSMSNotification.mutate({
                        userId,
                        currentValue: user.sms_notification,
                      });
                    }}
                  >
                    {user.sms_notification ? (
                      <MessageCircleOff className="mr-2 size-4" />
                    ) : (
                      <MessageCircle className="mr-2 size-4" />
                    )}
                    {user.sms_notification ? "Disable" : "Enable"} SMS
                    Notifications
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setUserToDelete(user);
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      session?.user?.email,
      updateRole,
      toggleNotification,
      toggleSMSNotification,
    ],
  );

  const tableData = data?.data || [];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.pagination.totalPages ?? -1,
    state: {
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
  });

  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = data?.pagination ? data.pagination.hasNextPage : false;

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-destructive">Error loading users</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search users by name..."
          value={globalFilter ?? ""}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
      </div>

      <Card className="w-full">
        <CardContent className="px-6 py-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : header.column.columnDef.header
                          ? typeof header.column.columnDef.header === "function"
                            ? header.column.columnDef.header(
                                header.getContext(),
                              )
                            : header.column.columnDef.header
                          : null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <div className="bg-card-foreground/10 h-4 animate-pulse rounded"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "actions" ? "relative" : ""
                        }
                        style={
                          cell.column.id === "actions"
                            ? {
                                overflow: "visible",
                                position: "relative",
                                zIndex: 1,
                              }
                            : undefined
                        }
                      >
                        {typeof cell.column.columnDef.cell === "function"
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.getValue() != null
                            ? String(cell.getValue())
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {data?.pagination ? (
            <>
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                data.pagination.total,
              )}{" "}
              of {data.pagination.total} users
              <span className="ml-2 text-xs">
                (Page {pagination.pageIndex + 1} of {data.pagination.totalPages}
                )
              </span>
            </>
          ) : (
            "Loading..."
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.previousPage();
            }}
            disabled={!canPreviousPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.nextPage();
            }}
            disabled={!canNextPage}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingUserId) {
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone and will permanently remove the user from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                handleCancelDelete();
              }}
              disabled={
                deletingUserId ===
                (userToDelete
                  ? typeof userToDelete.id === "string"
                    ? userToDelete.id
                    : String(userToDelete.id)
                  : null)
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  handleDeleteUser(userToDelete);
                }
              }}
              disabled={
                deletingUserId ===
                (userToDelete
                  ? typeof userToDelete.id === "string"
                    ? userToDelete.id
                    : String(userToDelete.id)
                  : null)
              }
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              {deletingUserId ===
              (userToDelete
                ? typeof userToDelete.id === "string"
                  ? userToDelete.id
                  : String(userToDelete.id)
                : null)
                ? "Deleting..."
                : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
