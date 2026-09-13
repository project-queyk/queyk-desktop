import { Dialogs } from "@wailsio/runtime";
import { DateRange } from "react-day-picker";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { FileChartColumnIncreasing, Info, Power } from "lucide-react";
import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";

import { getSession, useSession } from "@/lib/auth-client";
import type { ReadingItem } from "../../../bindings/queyk/internal/dashboard/models";
import {
  GetReadingsOverview,
  ListEarthquakes,
  SavePDFReport,
} from "../../../bindings/queyk/internal/dashboard/service";
import {
  capitalizeFirstLetter,
  formatSeismicMonitorDate,
  getRiskLevelColor,
} from "@/lib/utils";
import {
  earthquakeChartConfig,
  readingChartConfig,
  skeletonEarthquakeConfig,
  skeletonReadingChartConfig,
} from "@/lib/configs/chart";

import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/_main/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (
        url.searchParams.get("popup") === "true" ||
        url.searchParams.get("token")
      ) {
        return {};
      }
    }

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

      return {};
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
      }
      throw redirect({ to: "/sign-in" });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: sessionData } = useSession();
  const token = sessionData?.session?.token;

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [persistedFirstDate, setPersistedFirstDate] = useState<
    Date | undefined
  >(undefined);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const { data: readingsData, isLoading: readingsDataIsLoading } = useQuery({
    queryKey: [
      "readings",
      date?.from?.toISOString().split("T")[0],
      date?.to?.toISOString().split("T")[0],
      token,
    ],
    queryFn: async () => {
      if (!date?.from || !date?.to) return null;

      if (!token) throw new Error("No authorization token");

      const fromDate = new Date(date.from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(date.to);
      toDate.setHours(23, 59, 59, 999);

      return await GetReadingsOverview(
        token,
        fromDate.toISOString(),
        toDate.toISOString(),
      );
    },
    enabled: !!(date?.from && date?.to) && !!token,
  });

  const { data: remoteReportData, isLoading: remoteReportIsLoading } = useQuery(
    {
      queryKey: [
        "readings",
        date?.from?.toISOString().split("T")[0],
        date?.to?.toISOString().split("T")[0],
        token,
      ],
      queryFn: async () => {
        if (!date?.from || !date?.to) return null;

        if (!token) throw new Error("No authorization token");

        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

        const fromDate = new Date(date.from);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(date.to);
        toDate.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
          startDate: fromDate.toISOString(),
          endDate: toDate.toISOString(),
          platform: "web",
        });

        const response = await fetch(`${baseUrl}/v1/api/readings?${params}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Token-Type": "admin",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch remote report summary");
        }

        return response.json();
      },
      enabled: !!(date?.from && date?.to) && !!token,
    },
  );

  const { data: earthquakesData, isLoading: earthquakeDataIsLoading } =
    useQuery({
      queryKey: ["earthquakes", token],
      queryFn: async () => {
        if (!token) throw new Error("No authorization token");

        return await ListEarthquakes(token);
      },
      enabled: !!token,
      staleTime: 1000 * 60 * 5,
    });

  const { mutate: resetIoT, isPending: resetIoTIsPending } = useMutation({
    mutationFn: async () => {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token") || ""
          : "";

      const response = await fetch(`${baseUrl}/v1/api/iot/device/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Token-Type": "admin",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reboot IoT device");
      }

      return response.json();
    },
  });

  const readings = useMemo(() => {
    return (readingsData?.data as ReadingItem[]) || [];
  }, [readingsData?.data]);

  const batteryLevel = readingsData?.batteryLevel || 0;
  const aiSummary = remoteReportData?.aiSummary || "";
  const pdfBase64 =
    remoteReportData?.pdfBase64 || remoteReportData?.data?.pdfBase64;

  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-green-500";
    if (level >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  useEffect(() => {
    if (readingsData?.firstDate && !persistedFirstDate) {
      setPersistedFirstDate(new Date(readingsData.firstDate));
    }
  }, [readingsData?.firstDate, persistedFirstDate]);

  const chartData = useMemo(() => {
    return readings.map((reading) => {
      const d = new Date(reading.createdAt);
      return {
        time: d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        fullDateTime: d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        siAverage: reading.siAverage,
        siMaximum: reading.siMaximum,
        siMinimum: reading.siMinimum,
        riskLevel: reading.riskLevel,
      };
    });
  }, [readings]);

  const earthquakeHistoryData = useMemo(() => {
    const list = earthquakesData || [];
    return list.map((eq: any) => {
      const dateStr = eq.createdAt || eq.created_at?.time || eq.created_at;
      const d = new Date(dateStr);
      return {
        time: d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        fullDateTime: d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        magnitude: eq.magnitude,
        duration: eq.duration,
        riskLevel: eq.riskLevel || eq.risk_level,
      };
    });
  }, [earthquakesData]);

  const peakMagnitude = useMemo(() => {
    if (!readings.length) return { value: 0, time: "--" };
    const peak = readings.reduce((max, curr) =>
      curr.siMaximum > max.siMaximum ? curr : max,
    );
    return {
      value: peak.siMaximum,
      time: new Date(peak.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }, [readings]);

  const avgMagnitude = useMemo(() => {
    if (!readings.length) return "--";
    const sum = readings.reduce((acc, curr) => acc + curr.siAverage, 0);
    return (sum / readings.length).toFixed(3);
  }, [readings]);

  const significantReadings = useMemo(() => {
    if (!readings.length) return "--";
    return readings.filter((r) => r.siMaximum > 1.0).length;
  }, [readings]);

  const peakActivity = useMemo(() => {
    if (!readings.length)
      return { value: "--", siAverage: 0, fullDateTime: "" };
    const peak = readings.reduce((max, curr) =>
      curr.siAverage > max.siAverage ? curr : max,
    );
    return {
      value: new Date(peak.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      siAverage: peak.siAverage,
      fullDateTime: peak.createdAt,
    };
  }, [readings]);

  async function downloadReport(
    pdfBase64: string,
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    const filename =
      startDate && endDate
        ? `seismic-report-${startDate.split("T")[0]}-to-${
            endDate.split("T")[0]
          }_${timestamp}.pdf`
        : `seismic-report_${timestamp}.pdf`;

    try {
      if (Dialogs?.SaveFile) {
        const filePath = await Dialogs.SaveFile({
          Filename: filename,
          Filters: [
            {
              DisplayName: "PDF Files (*.pdf)",
              Pattern: "*.pdf",
            },
          ],
        });
        if (filePath) {
          await SavePDFReport(filePath, pdfBase64);
          return;
        }
        return;
      }
    } catch {}

    try {
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))],
        { type: "application/pdf" },
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch {
      try {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))],
          { type: "application/pdf" },
        );
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
      } catch {}
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <DatePickerWithRange
          date={date}
          onDateChange={setDate}
          startDate={persistedFirstDate}
          disabled={readingsDataIsLoading}
        />
        <div className="flex items-center gap-4">
          <Button
            className="flex gap-2"
            disabled={
              !formatSeismicMonitorDate(date) ||
              remoteReportIsLoading ||
              !pdfBase64 ||
              !remoteReportData?.data?.length
            }
            onClick={() =>
              downloadReport(
                pdfBase64,
                date?.from?.toISOString(),
                date?.to?.toISOString(),
              )
            }
          >
            <FileChartColumnIncreasing />
            Generate
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:flex">
        <Card className="flex w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 p-0">
            <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
              <CardTitle className="relative mb-2">
                <p>Peak SI Maximum</p>
                <Tooltip>
                  <TooltipTrigger className="absolute top-0 right-0 z-10">
                    <Info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Highest seismic intensity reading during the selected
                      period
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="flex w-full items-center justify-between">
                {readingsDataIsLoading ? (
                  <div className="animate-pulse">
                    <div className="bg-card-foreground/10 h-8 w-16 rounded"></div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-primary text-2xl font-semibold">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? peakMagnitude.value.toFixed(3)
                        : "--"}
                    </span>
                    <span className="text-muted-foreground block">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? `at ${peakMagnitude.time}`
                        : "No data"}
                    </span>
                  </div>
                )}
                {readingsDataIsLoading ? (
                  <div className="bg-card-foreground/10 h-16 w-24 animate-pulse rounded pt-4"></div>
                ) : (
                  <ChartContainer
                    config={{
                      siMaximum: {
                        label: "SI Maximum",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-16 w-24"
                  >
                    <LineChart
                      data={chartData.slice(-7)}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <Line
                        type="stepAfter"
                        dataKey="siMaximum"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="flex w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 p-0">
            <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
              <CardTitle className="relative mb-2">
                <p>Average SI Reading</p>
                <Tooltip>
                  <TooltipTrigger className="absolute top-0 right-0 z-10">
                    <Info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Mean seismic intensity across all readings for the
                      selected timeframe
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="flex w-full items-center justify-between">
                {readingsDataIsLoading ? (
                  <div className="animate-pulse">
                    <div className="bg-card-foreground/10 h-8 w-16 rounded"></div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-primary text-2xl font-semibold">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? avgMagnitude
                        : "--"}
                    </span>
                    <span className="text-muted-foreground block">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? `across ${readings.length} readings`
                        : "No data"}
                    </span>
                  </div>
                )}
                {readingsDataIsLoading ? (
                  <div className="bg-card-foreground/10 h-16 w-24 animate-pulse rounded pt-4"></div>
                ) : (
                  <ChartContainer
                    config={{
                      siAverage: {
                        label: "SI Average",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-16 w-24"
                  >
                    <LineChart
                      data={chartData.slice(-7)}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <Line
                        type="basis"
                        dataKey="siAverage"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="flex w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 p-0">
            <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
              <CardTitle className="relative mb-2">
                <p>Significant Activity Readings</p>
                <Tooltip>
                  <TooltipTrigger className="absolute top-0 right-0 z-10">
                    <Info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Readings where SI Maximum exceeded 1.0</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="flex w-full items-center justify-between">
                {readingsDataIsLoading ? (
                  <div className="animate-pulse">
                    <div className="bg-card-foreground/10 h-8 w-16 rounded"></div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-primary text-2xl font-semibold">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? significantReadings
                        : "--"}
                    </span>
                    <span className="text-muted-foreground block">
                      {formatSeismicMonitorDate(date) && readings.length
                        ? `readings above threshold`
                        : "No data"}
                    </span>
                  </div>
                )}
                {readingsDataIsLoading ? (
                  <div className="bg-card-foreground/10 h-16 w-24 animate-pulse rounded pt-4"></div>
                ) : (
                  <ChartContainer
                    config={{
                      significant: {
                        label: "Significant Readings",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-16 w-24"
                  >
                    <LineChart
                      data={chartData.slice(-7).map((item) => {
                        const isSignificant = item.siMaximum > 1.0;
                        return {
                          ...item,
                          significant: isSignificant ? 1 : 0,
                        };
                      })}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="significant"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={1.5}
                        dot={true}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="flex w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 p-0">
            <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
              <CardTitle className="relative mb-2">
                <p>Peak Activity Time</p>
                <Tooltip>
                  <TooltipTrigger className="absolute top-0 right-0 z-10">
                    <Info className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Time with the highest average seismic intensity</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="flex w-full items-center justify-between">
                {readingsDataIsLoading ? (
                  <div className="animate-pulse">
                    <div className="bg-card-foreground/10 h-8 w-16 rounded"></div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-primary text-2xl font-semibold">
                      {formatSeismicMonitorDate(date) &&
                      readings.length &&
                      peakActivity.fullDateTime
                        ? new Date(
                            peakActivity.fullDateTime,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--"}
                    </span>
                    <span className="text-muted-foreground block">
                      {formatSeismicMonitorDate(date) &&
                      readings.length &&
                      peakActivity.fullDateTime
                        ? `${new Date(
                            peakActivity.fullDateTime,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} (${peakActivity.siAverage?.toFixed(3)} SI)`
                        : "No data"}
                    </span>
                  </div>
                )}
                {readingsDataIsLoading ? (
                  <div className="bg-card-foreground/10 h-16 w-24 animate-pulse rounded pt-4"></div>
                ) : (
                  <ChartContainer
                    config={{
                      activityTime: {
                        label: "Activity Intensity",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-16 w-24"
                  >
                    <LineChart
                      data={chartData.slice(-7).map((item) => {
                        return {
                          ...item,
                          activityTime: item.siAverage,
                          isPeakTime:
                            peakActivity.fullDateTime &&
                            new Date(item.fullDateTime).getTime() ===
                              new Date(peakActivity.fullDateTime).getTime(),
                        };
                      })}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="activityTime"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-3 md:flex">
        <Card className="flex w-full">
          <CardHeader className="mx-4.5 flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
              <CardTitle>Seismic Activity Monitor</CardTitle>
              <CardDescription>
                {formatSeismicMonitorDate(date)
                  ? `Seismic readings for ${formatSeismicMonitorDate(date)} • Data averaged every 5 minutes`
                  : "No seismic readings • Data averaged every 5 minutes"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={
                readingsDataIsLoading
                  ? skeletonReadingChartConfig
                  : readingChartConfig
              }
              className="aspect-auto h-62.5 w-full"
            >
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                {!readingsDataIsLoading && (
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background rounded-lg border p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[0.70rem] uppercase">
                                  Time
                                </span>
                                <span className="font-bold">
                                  {data.fullDateTime}
                                </span>
                                <span
                                  className={`font-bold ${getRiskLevelColor(data.riskLevel)}`}
                                >
                                  {capitalizeFirstLetter(data.riskLevel)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                              {payload.map((entry, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor: entry.color,
                                    }}
                                  />
                                  <span className="text-sm">
                                    {entry.name}:{" "}
                                    {typeof entry.value === "number"
                                      ? entry.value.toFixed(3)
                                      : "--"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                )}
                <Line
                  dataKey="siAverage"
                  type="monotone"
                  stroke={
                    readingsDataIsLoading ? "#d1d5db" : "var(--color-siAverage)"
                  }
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="siMaximum"
                  type="monotone"
                  stroke={
                    readingsDataIsLoading ? "#e5e7eb" : "var(--color-siMaximum)"
                  }
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="siMinimum"
                  type="monotone"
                  stroke={
                    readingsDataIsLoading ? "#f3f4f6" : "var(--color-siMinimum)"
                  }
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <Card className="hidden w-full md:block">
          <CardHeader className="mx-4.5 flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
              <CardTitle>Earthquake History</CardTitle>
              <CardDescription>
                Historical earthquake events and intensity records over time
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={
                earthquakeDataIsLoading
                  ? skeletonEarthquakeConfig
                  : earthquakeChartConfig
              }
              className="aspect-auto h-62.5 w-full"
            >
              <LineChart
                accessibilityLayer
                data={earthquakeHistoryData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                {!earthquakeDataIsLoading && (
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background rounded-lg border p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[0.70rem] uppercase">
                                  Time
                                </span>
                                <span className="font-bold">
                                  {new Date(data.createdAt).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                <span
                                  className={`font-bold ${getRiskLevelColor(data.riskLevel)}`}
                                >
                                  {capitalizeFirstLetter(data.riskLevel)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: "hsl(var(--chart-1))",
                                  }}
                                />
                                <span className="text-sm">
                                  Magnitude:{" "}
                                  {typeof data.magnitude === "number"
                                    ? data.magnitude.toFixed(1)
                                    : "--"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gray-400" />
                                <span className="text-sm">
                                  Duration:{" "}
                                  {typeof data.duration === "number"
                                    ? (() => {
                                        const dur = data.duration;
                                        if (dur >= 3600) {
                                          const hours = Math.floor(dur / 3600);
                                          const minutes = Math.floor(
                                            (dur % 3600) / 60,
                                          );
                                          return `${hours}h ${minutes}m ${dur % 60}s`;
                                        }
                                        if (dur >= 60) {
                                          const minutes = Math.floor(dur / 60);
                                          return `${minutes}m ${dur % 60}s`;
                                        }
                                        return `${dur}s`;
                                      })()
                                    : "--"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                )}
                <Line
                  dataKey="magnitude"
                  type="monotone"
                  stroke={
                    earthquakeDataIsLoading ? "#e5e7eb" : "hsl(var(--chart-1))"
                  }
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="grid w-full gap-3">
          <Card className="relative min-h-64 w-full overflow-hidden border-0 bg-linear-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
            <CardHeader className="relative z-10 flex flex-col space-y-0 p-0 sm:flex-row">
              <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
                <CardTitle className="bg-linear-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text pb-1 font-semibold text-transparent">
                  AI Summary
                </CardTitle>
                <CardDescription>
                  {remoteReportIsLoading ? (
                    <div className="space-y-2">
                      <div className="bg-card-foreground/10 h-4 w-full animate-pulse rounded"></div>
                      <div className="bg-card-foreground/10 h-4 w-3/4 animate-pulse rounded"></div>
                      <div className="bg-card-foreground/10 h-4 w-1/2 animate-pulse rounded"></div>
                    </div>
                  ) : (
                    <p className="text-foreground text-sm leading-relaxed">
                      {formatSeismicMonitorDate(date) && aiSummary
                        ? aiSummary
                        : "No AI summary available for the selected period"}
                    </p>
                  )}
                </CardDescription>
                <p className="text-muted-foreground mt-1 text-xs">
                  AI-generated analysis of seismic activity patterns
                </p>
              </div>
            </CardHeader>
          </Card>
          <div className="relative">
            <Card className="w-full">
              <CardHeader className="flex flex-col space-y-0 p-0 sm:flex-row">
                <div className="flex flex-col justify-center gap-1 px-6 py-2 sm:py-3">
                  <CardTitle>Battery Level</CardTitle>
                  <CardDescription>
                    {readingsDataIsLoading ? (
                      <div className="animate-pulse">
                        <div className="bg-card-foreground/10 h-8 w-16 rounded"></div>
                      </div>
                    ) : (
                      <span
                        className={`text-2xl font-semibold ${
                          cooldown > 0
                            ? "text-primary"
                            : batteryLevel
                              ? getBatteryColor(batteryLevel)
                              : "text-red-500"
                        }`}
                      >
                        {cooldown > 0
                          ? "Rebooting..."
                          : batteryLevel
                            ? `${batteryLevel}%`
                            : "Offline"}
                      </span>
                    )}
                  </CardDescription>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Current IoT sensor battery level
                  </p>
                </div>
              </CardHeader>
            </Card>
            <Button
              variant="secondary"
              className="absolute top-6 right-6 shrink-0 cursor-pointer"
              disabled={resetIoTIsPending || cooldown > 0 || !batteryLevel}
              onClick={() => {
                resetIoT();
                setCooldown(30);
              }}
            >
              <Power />
              <p>Reboot device</p>
            </Button>
          </div>
        </div>
        <Card className="w-full md:hidden">
          <CardHeader className="mx-4.5 flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
              <CardTitle>Earthquake History</CardTitle>
              <CardDescription>
                Historical earthquake events and intensity records over time
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={
                earthquakeDataIsLoading
                  ? skeletonEarthquakeConfig
                  : earthquakeChartConfig
              }
              className="aspect-auto h-62.5 w-full"
            >
              <LineChart
                accessibilityLayer
                data={earthquakeHistoryData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                {!earthquakeDataIsLoading && (
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background rounded-lg border p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-[0.70rem] uppercase">
                                  Time
                                </span>
                                <span className="font-bold">
                                  {new Date(data.createdAt).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                <span
                                  className={`font-bold ${getRiskLevelColor(data.riskLevel)}`}
                                >
                                  {capitalizeFirstLetter(data.riskLevel)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: "hsl(var(--chart-1))",
                                  }}
                                />
                                <span className="text-sm">
                                  Magnitude:{" "}
                                  {typeof data.magnitude === "number"
                                    ? data.magnitude.toFixed(1)
                                    : "--"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gray-400" />
                                <span className="text-sm">
                                  Duration:{" "}
                                  {typeof data.duration === "number"
                                    ? (() => {
                                        const dur = data.duration;
                                        if (dur >= 3600) {
                                          const hours = Math.floor(dur / 3600);
                                          const minutes = Math.floor(
                                            (dur % 3600) / 60,
                                          );
                                          return `${hours}h ${minutes}m ${dur % 60}s`;
                                        }
                                        if (dur >= 60) {
                                          const minutes = Math.floor(dur / 60);
                                          return `${minutes}m ${dur % 60}s`;
                                        }
                                        return `${dur}s`;
                                      })()
                                    : "--"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                )}
                <Line
                  dataKey="magnitude"
                  type="monotone"
                  stroke={
                    earthquakeDataIsLoading ? "#e5e7eb" : "hsl(var(--chart-1))"
                  }
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
