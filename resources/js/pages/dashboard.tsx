import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2, ClipboardList, Plus, WalletCards } from 'lucide-react';

type DashboardStats = {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    revenue: number | string;
};

type RecentOrder = {
    id: number;
    dispatch_id: string;
    total_bill: number | string;
    dispatch_status: string;
    created_at: string;
    customer: { customer_name: string };
    restaurant: { restaurant_name: string };
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: route('dashboard') }];
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'delivered') return 'default';
    if (status === 'cancelled') return 'destructive';
    if (status === 'pending') return 'outline';
    return 'secondary';
}

export default function Dashboard({ stats, recentOrders }: { stats: DashboardStats; recentOrders: RecentOrder[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-primary">Platform overview</p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="mt-2 text-muted-foreground">A quick look at your food orders and deliveries.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('food-orders.create')}>
                            <Plus />
                            Create order
                        </Link>
                    </Button>
                </div>

                <section aria-label="Order summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 pt-6">
                            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ClipboardList className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm text-muted-foreground">Total orders</p>
                                <p className="text-2xl font-semibold">{stats.totalOrders}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 pt-6">
                            <span className="flex size-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                <ArrowUpRight className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm text-muted-foreground">Active orders</p>
                                <p className="text-2xl font-semibold">{stats.activeOrders}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 pt-6">
                            <span className="flex size-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivered</p>
                                <p className="text-2xl font-semibold">{stats.deliveredOrders}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 pt-6">
                            <span className="flex size-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                <WalletCards className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm text-muted-foreground">Delivered revenue</p>
                                <p className="text-2xl font-semibold">{currency.format(Number(stats.revenue))}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent orders</CardTitle>
                        <CardDescription>The latest orders and their delivery status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <ClipboardList className="size-6 text-muted-foreground" />
                                </span>
                                <h2 className="mt-4 font-medium">No food orders yet</h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Create your first order to see delivery activity here.
                                </p>
                                <Button asChild className="mt-5">
                                    <Link href={route('food-orders.create')}>
                                        <Plus />
                                        Create order
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            <th className="px-3 py-3">Dispatch</th>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Restaurant</th>
                                            <th className="px-3 py-3">Total</th>
                                            <th className="px-3 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id} className="border-b last:border-0">
                                                <td className="px-3 py-4">
                                                    <p className="font-medium">{order.dispatch_id}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-4">{order.customer.customer_name}</td>
                                                <td className="px-3 py-4">{order.restaurant.restaurant_name}</td>
                                                <td className="px-3 py-4 font-medium">{currency.format(Number(order.total_bill))}</td>
                                                <td className="px-3 py-4">
                                                    <Badge variant={statusVariant(order.dispatch_status)}>
                                                        {order.dispatch_status.replaceAll('_', ' ')}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="mt-5 flex justify-end">
                            <Button variant="outline" asChild>
                                <Link href={route('food-orders.index')}>View all orders</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
