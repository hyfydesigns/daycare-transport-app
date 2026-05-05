import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route, Plus, Bus, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { RouteFormDialog } from "./route-form-dialog";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const session = await auth();
  const [routes, drivers, vehicles] = await Promise.all([
    prisma.route.findMany({
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        stops: { orderBy: { sequence: "asc" }, include: { school: true }, take: 1 },
        childAssignments: { where: { active: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.driver.findMany({ where: { active: true }, include: { user: true } }),
    prisma.vehicle.findMany({ where: { status: { not: "RETIRED" } } }),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Route className="h-5 w-5 md:h-6 md:w-6" /> Routes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{routes.length} routes configured</p>
        </div>
        {isAdmin && <RouteFormDialog drivers={drivers} vehicles={vehicles} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{route.name}</CardTitle>
                <Badge variant={route.active ? "success" : "secondary"} className="text-xs">
                  {route.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{route.code}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{route.driver?.user.name ?? <span className="text-muted-foreground italic">No driver</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bus className="h-4 w-4 text-muted-foreground" />
                <span>{route.vehicle?.identifier ?? <span className="text-muted-foreground italic">No vehicle</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{route.childAssignments.length} children assigned</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Days: {route.activeDays}
              </div>
              <div className="pt-2 flex gap-2">
                <Link href={`/routes/${route.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <MapPin className="h-3.5 w-3.5 mr-1" /> View Stops
                  </Button>
                </Link>
                {isAdmin && (
                  <RouteFormDialog
                    route={route}
                    drivers={drivers}
                    vehicles={vehicles}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {routes.length === 0 && (
          <p className="text-muted-foreground col-span-3 py-8 text-center">No routes yet. Create your first route.</p>
        )}
      </div>
    </div>
  );
}
