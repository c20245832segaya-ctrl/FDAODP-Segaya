import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, MapPin, Plus, ReceiptText, ShoppingBag, Trash2 } from 'lucide-react';
import { type FormEvent } from 'react';

type OrderStatus = 'pending' | 'assigned' | 'preparing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';

type OrderItem = {
    menu_item_name: string;
    item_price: string;
    quantity: number;
};

type FoodOrderForm = {
    dispatch_id: string;
    customer_name: string;
    delivery_address: string;
    restaurant_name: string;
    rider_id: string | null; // Changed to allow null/empty
    delivery_fee: string;
    dispatch_status: OrderStatus;
    items: OrderItem[];
};

type AvailableRider = {
    id: number;
    rider_name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Food orders', href: route('food-orders.index') },
    { title: 'Create order', href: route('food-orders.create') },
];

const statuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'picked_up', label: 'Picked up' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

const emptyItem = (): OrderItem => ({ menu_item_name: '', item_price: '', quantity: 1 });

const MAX_AMOUNT = 99_999_999.99;
const MAX_QUANTITY = 4_294_967_295;

const clampMoneyInput = (value: string) => {
    if (value === '') {
        return '';
    }

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
        return '';
    }

    if (amount > MAX_AMOUNT) {
        return MAX_AMOUNT.toFixed(2);
    }

    const [whole, decimal = ''] = value.split('.');
    return decimal.length > 2 ? `${whole}.${decimal.slice(0, 2)}` : value;
};

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
});

const capitalizeName = (value: string) =>
    value.replace(/(^|[\s'-])(\p{Ll})/gu, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase());

export default function CreateFoodOrder({
    statuses: availableStatuses = statuses.map((status) => status.value),
    riders = [],
}: {
    statuses?: OrderStatus[];
    riders?: AvailableRider[];
}) {
    console.log('Riders received from backend:', riders);

    const form = useForm<FoodOrderForm>({
        dispatch_id: '',
        customer_name: '',
        delivery_address: '',
        restaurant_name: '',
        rider_id: null, // Initialize as null
        delivery_fee: '0.00',
        dispatch_status: 'pending',
        items: [emptyItem()],
    });

    const subtotal = form.data.items.reduce((total, item) => {
        return total + (Number(item.item_price) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const deliveryFee = Number(form.data.delivery_fee) || 0;
    const total = subtotal + deliveryFee;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(route('food-orders.store'));
    };

    const updateItem = <K extends keyof OrderItem>(index: number, key: K, value: OrderItem[K]) => {
        const items = [...form.data.items];
        items[index] = { ...items[index], [key]: value };
        form.setData('items', items);
    };

    const itemError = (index: number, key: keyof OrderItem) => form.errors[`items.${index}.${key}` as keyof typeof form.errors];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create food order" />

            <main className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-3">
                            <Link href={route('food-orders.index')}>
                                <ArrowLeft />
                                Back to orders
                            </Link>
                        </Button>
                        <div>
                            <p className="text-primary text-sm font-medium">Order management</p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Create food order</h1>
                            <p className="text-muted-foreground mt-2">Add the delivery details and items for this order.</p>
                        </div>
                    </div>
                    <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
                        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">1</span>
                        <span className="text-foreground font-medium">Order details</span>
                        <span className="bg-border mx-1 h-px w-8" />
                        <span className="flex size-8 items-center justify-center rounded-full border">2</span>
                        <span>Review</span>
                    </div>
                </div>

                <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                                        <ClipboardList className="size-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-lg">Order information</CardTitle>
                                        <CardDescription>Set a dispatch reference and choose the current status.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="dispatch_id">Dispatch ID</Label>
                                    <Input
                                        id="dispatch_id"
                                        value={form.data.dispatch_id}
                                        onChange={(event) => form.setData('dispatch_id', event.target.value)}
                                        placeholder="e.g. FD-2026-001"
                                        maxLength={100}
                                        required
                                    />
                                    <InputError message={form.errors.dispatch_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dispatch_status">Status</Label>
                                    <Select
                                        value={form.data.dispatch_status}
                                        onValueChange={(value) => form.setData('dispatch_status', value as OrderStatus)}
                                    >
                                        <SelectTrigger id="dispatch_status">
                                            <SelectValue placeholder="Choose a status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStatuses.map((status) => {
                                                const label = statuses.find((item) => item.value === status)?.label ?? status;
                                                return (
                                                    <SelectItem key={status} value={status}>
                                                        {label}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.dispatch_status} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                        <MapPin className="size-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-lg">Customer & delivery</CardTitle>
                                        <CardDescription>Where should this order be delivered?</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_name">Customer name</Label>
                                    <Input
                                        id="customer_name"
                                        value={form.data.customer_name}
                                        onChange={(event) => form.setData('customer_name', capitalizeName(event.target.value))}
                                        placeholder="Full name"
                                        maxLength={255}
                                        required
                                    />
                                    <InputError message={form.errors.customer_name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant_name">Restaurant</Label>
                                    <Input
                                        id="restaurant_name"
                                        value={form.data.restaurant_name}
                                        onChange={(event) => form.setData('restaurant_name', capitalizeName(event.target.value))}
                                        placeholder="Restaurant name"
                                        maxLength={255}
                                        required
                                    />
                                    <InputError message={form.errors.restaurant_name} />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="rider_id">Delivery rider</Label>
                                    <select
                                        id="rider_id"
                                        name="rider_id"
                                        value={form.data.rider_id ?? ''}
                                        onChange={(event) => form.setData('rider_id', event.target.value || null)}
                                        className="border-input bg-background focus-visible:ring-ring mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        <option value="">Select a rider (or leave blank for random)</option>
                                        {riders &&
                                            riders.map((rider) => (
                                                <option key={rider.id} value={rider.id}>
                                                    {rider.rider_name}
                                                </option>
                                            ))}
                                    </select>
                                    <InputError message={form.errors.rider_id} />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="delivery_address">Delivery address</Label>
                                    <textarea
                                        id="delivery_address"
                                        value={form.data.delivery_address}
                                        onChange={(event) => form.setData('delivery_address', event.target.value)}
                                        placeholder="Street, building, barangay, city"
                                        maxLength={1000}
                                        required
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-y rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                    />
                                    <InputError message={form.errors.delivery_address} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                        <ShoppingBag className="size-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-lg">Order items</CardTitle>
                                        <CardDescription>Add each menu item and its quantity.</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => form.setData('items', [...form.data.items, emptyItem()])}
                                >
                                    <Plus />
                                    <span className="hidden sm:inline">Add item</span>
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {form.data.items.map((item, index) => (
                                    <div key={index} className="bg-muted/20 rounded-lg border p-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <p className="text-sm font-medium">Item {index + 1}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove item ${index + 1}`}
                                                disabled={form.data.items.length === 1}
                                                onClick={() =>
                                                    form.setData(
                                                        'items',
                                                        form.data.items.filter((_, itemIndex) => itemIndex !== index),
                                                    )
                                                }
                                                className="text-muted-foreground hover:text-destructive size-8"
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px_110px]">
                                            <div className="grid gap-2">
                                                <Label htmlFor={`item-name-${index}`}>Menu item</Label>
                                                <Input
                                                    id={`item-name-${index}`}
                                                    value={item.menu_item_name}
                                                    onChange={(event) => updateItem(index, 'menu_item_name', event.target.value)}
                                                    placeholder="e.g. Chicken adobo"
                                                    maxLength={255}
                                                    required
                                                />
                                                <InputError message={itemError(index, 'menu_item_name')} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`item-price-${index}`}>Price</Label>
                                                <Input
                                                    id={`item-price-${index}`}
                                                    type="number"
                                                    min="0"
                                                    max="99999999.99"
                                                    step="0.01"
                                                    value={item.item_price}
                                                    onChange={(event) => updateItem(index, 'item_price', clampMoneyInput(event.target.value))}
                                                    placeholder="0.00"
                                                    className="min-w-0 tabular-nums"
                                                    required
                                                />
                                                <InputError message={itemError(index, 'item_price')} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                                                <Input
                                                    id={`item-quantity-${index}`}
                                                    type="number"
                                                    min="1"
                                                    max="4294967295"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(event) => {
                                                        const quantity = Number(event.target.value);
                                                        updateItem(
                                                            index,
                                                            'quantity',
                                                            Number.isFinite(quantity) ? Math.min(MAX_QUANTITY, Math.max(1, quantity)) : 1,
                                                        );
                                                    }}
                                                    className="min-w-0 tabular-nums"
                                                    required
                                                />
                                                <InputError message={itemError(index, 'quantity')} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <InputError message={form.errors.items} />
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <ReceiptText className="text-primary size-5" />
                                    <CardTitle className="text-lg">Order summary</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-muted-foreground grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-3 text-sm">
                                    <span className="min-w-0">Items ({form.data.items.length})</span>
                                    <span className="min-w-0 text-right [overflow-wrap:anywhere] break-words tabular-nums">
                                        {currency.format(subtotal)}
                                    </span>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="delivery_fee">Delivery fee</Label>
                                    <Input
                                        id="delivery_fee"
                                        type="number"
                                        min="0"
                                        max="99999999.99"
                                        step="0.01"
                                        value={form.data.delivery_fee}
                                        onChange={(event) => form.setData('delivery_fee', clampMoneyInput(event.target.value))}
                                        className="min-w-0 tabular-nums"
                                        required
                                    />
                                    <InputError message={form.errors.delivery_fee} />
                                </div>
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                                        <span className="font-medium">Total</span>
                                        <span className="min-w-0 text-right text-xl font-semibold tracking-tight [overflow-wrap:anywhere] break-words tabular-nums sm:text-2xl">
                                            {currency.format(total)}
                                        </span>
                                    </div>
                                    <InputError message={form.errors['total_bill' as keyof typeof form.errors]} />
                                </div>
                                <Button type="submit" className="w-full" disabled={form.processing}>
                                    {form.processing ? 'Creating order…' : 'Create order'}
                                </Button>
                                <p className="text-muted-foreground text-center text-xs">You can review and update the order after creation.</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 shadow-none">
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium">Before you submit</p>
                                <p className="text-muted-foreground mt-1 text-sm">Check the dispatch ID, delivery address, and item quantities.</p>
                            </CardContent>
                        </Card>
                    </aside>
                </form>
            </main>
        </AppLayout>
    );
}
