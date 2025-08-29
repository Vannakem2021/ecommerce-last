"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "@/lib/actions/order.actions";
import {
  calculateFutureDate,
  formatDateTime,
  timeUntilMidnight,
} from "@/lib/utils";
import { CambodiaAddressSchema } from "@/lib/validator";
import { CambodiaAddressForm } from "@/components/shared/address/cambodia-address-form";
import { AddressDisplay, isAddressComplete } from "@/components/shared/address/address-display";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import CheckoutFooter from "./checkout-footer";
import { ShippingAddress, CambodiaAddress } from "@/types";
import useIsMounted from "@/hooks/use-is-mounted";
import Link from "next/link";
import useUserCart from "@/hooks/use-user-cart";
import useSettingStore from "@/hooks/use-setting-store";
import ProductPrice from "@/components/shared/product/product-price";
import CouponInput from "@/components/shared/promotion/coupon-input";
import DiscountSummary from "@/components/shared/promotion/discount-summary";
import { useAuthSession } from "@/hooks/use-auth-session";
import { IUser } from "@/lib/db/models/user.model";

// Clean default values for address form (no pre-fill data)
const emptyAddressValues = {
  fullName: "",
  phone: "",
  provinceId: undefined,
  districtId: undefined,
  communeCode: "",
  houseNumber: "",
  street: "",
  postalCode: "",
  provinceName: "",
  districtName: "",
  communeName: "",
};

const CheckoutForm = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { user: sessionUser } = useAuthSession();
  const [fullUser, setFullUser] = useState<IUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const {
    setting: {
      site,
      availablePaymentMethods,
      defaultPaymentMethod,
      availableDeliveryDates,
      abaPayWay,
    },
  } = useSettingStore();

  // Filter payment methods based on configuration
  const filteredPaymentMethods = availablePaymentMethods.filter((pm) => {
    if (pm.name === "ABA PayWay") {
      // Only show ABA PayWay if it's enabled and has merchant ID configured
      return abaPayWay?.enabled && abaPayWay?.merchantId;
    }
    return true; // Show all other payment methods
  });

  const {
    cart: {
      items,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      shippingAddress,
      deliveryDateIndex,
      paymentMethod = defaultPaymentMethod,
      appliedPromotion,
      discountAmount,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    clearCart,
    setDeliveryDateIndex,
  } = useUserCart();
  const isMounted = useIsMounted();

  // Fetch full user data when session user is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!sessionUser?.id) {
        setUserLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/me');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setFullUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setFullUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, [sessionUser?.id]);

  // Check if user has a complete saved address
  const userHasSavedAddress = fullUser?.address && isAddressComplete(fullUser.address as CambodiaAddress);

  // Also check if there's a complete address in the cart's shipping address
  const hasCompleteShippingAddress = shippingAddress && isAddressComplete(shippingAddress);

  // Determine the default values for the form
  const getDefaultAddressValues = () => {
    // If there's already a shipping address in cart, use it
    if (shippingAddress) {
      return shippingAddress;
    }
    // If user has a saved address, use it
    if (userHasSavedAddress) {
      return fullUser.address as CambodiaAddress;
    }
    // Otherwise use empty values
    return emptyAddressValues;
  };

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(CambodiaAddressSchema),
    defaultValues: getDefaultAddressValues(),
  });

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    setShippingAddress(values);
    setIsAddressSelected(true);
    setShowAddressForm(false); // Hide form after successful submission
  };

  // Validate if address is complete for order placement
  const validateAddressForOrder = (): boolean => {
    if (!shippingAddress) {
      toast({
        description: "Please provide a shipping address before placing your order.",
        variant: "destructive",
      });
      return false;
    }

    const isComplete = isAddressComplete(shippingAddress);
    if (!isComplete) {
      toast({
        description: "Please complete all required address fields before placing your order.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Initialize shipping address from user's saved address if available and no cart address exists
  useEffect(() => {
    if (!isMounted || !fullUser || userLoading) return;

    // If cart doesn't have shipping address but user has saved address, use it
    if (!shippingAddress && userHasSavedAddress) {
      setShippingAddress(fullUser.address as CambodiaAddress);
    }
  }, [isMounted, fullUser, userLoading, shippingAddress, userHasSavedAddress, setShippingAddress]);

  // Update form when shipping address changes
  useEffect(() => {
    if (!isMounted || !shippingAddress) return;

    // Reset form with current shipping address
    shippingAddressForm.reset(shippingAddress);
  }, [isMounted, shippingAddress, shippingAddressForm]);

  // Initialize address selection state based on whether user has saved address
  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false);
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false);
  const [isDeliveryDateSelected, setIsDeliveryDateSelected] =
    useState<boolean>(false);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);

  // Initialize address selection state when component mounts
  useEffect(() => {
    if ((userHasSavedAddress || hasCompleteShippingAddress) && shippingAddress) {
      setIsAddressSelected(true);
    }
    // Show form immediately for users without saved addresses and no complete shipping address
    if (!userHasSavedAddress && !hasCompleteShippingAddress) {
      setShowAddressForm(true);
    }
  }, [userHasSavedAddress, hasCompleteShippingAddress, shippingAddress]);

  const handlePlaceOrder = async () => {
    // Validate address before placing order
    if (!validateAddressForOrder()) {
      return;
    }

    const res = await createOrder({
      items,
      shippingAddress,
      expectedDeliveryDate: calculateFutureDate(
        availableDeliveryDates[deliveryDateIndex!].daysToDeliver
      ),
      deliveryDateIndex,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      appliedPromotion,
      discountAmount,
    });
    if (!res.success) {
      toast({
        description: res.message,
        variant: "destructive",
      });
    } else {
      toast({
        description: res.message,
        variant: "default",
      });
      clearCart();
      router.push(`/checkout/${res.data?.orderId}`);
    }
  };
  const handleSelectPaymentMethod = () => {
    setIsAddressSelected(true);
    setIsPaymentMethodSelected(true);
  };
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)();
  };
  const CheckoutSummary = () => (
    <Card>
      <CardContent className="p-4">
        {!isAddressSelected && (
          <div className="border-b mb-4">
            <Button
              className="rounded-full w-full"
              onClick={handleSelectShippingAddress}
            >
              Ship to this address
            </Button>
            <p className="text-xs text-center py-2">
              Choose a shipping address and payment method in order to calculate
              shipping, handling, and tax.
            </p>
          </div>
        )}
        {isAddressSelected && !isPaymentMethodSelected && (
          <div className=" mb-4">
            <Button
              className="rounded-full w-full"
              onClick={handleSelectPaymentMethod}
            >
              Use this payment method
            </Button>

            <p className="text-xs text-center py-2">
              Choose a payment method to continue checking out. You&apos;ll
              still have a chance to review and edit your order before it&apos;s
              final.
            </p>
          </div>
        )}
        {isPaymentMethodSelected && isAddressSelected && (
          <div>
            <Button onClick={handlePlaceOrder} className="rounded-full w-full">
              Place Your Order
            </Button>
            <p className="text-xs text-center py-2">
              By placing your order, you agree to {site.name}&apos;s{" "}
              <Link href="/page/privacy-policy">privacy notice</Link> and
              <Link href="/page/conditions-of-use"> conditions of use</Link>.
            </p>
          </div>
        )}

        {/* Coupon Input */}
        <CouponInput />

        <div>
          <div className="text-lg font-bold">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined ? (
                  "--"
                ) : shippingPrice === 0 ? (
                  "FREE"
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span> Tax:</span>
              <span>
                {taxPrice === undefined ? (
                  "--"
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>

            {/* Discount Summary */}
            <DiscountSummary />

            <div className="flex justify-between  pt-4 font-bold text-lg">
              <span> Order Total:</span>
              <span>
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while user data is being fetched
  if (!isMounted || userLoading) {
    return (
      <main className="max-w-6xl mx-auto highlight-link">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading checkout...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto highlight-link">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* shipping address */}
          <div>
            {isAddressSelected && shippingAddress ? (
              <div className="grid grid-cols-1 md:grid-cols-12    my-3  pb-3">
                <div className="col-span-5 flex text-lg font-bold ">
                  <span className="w-8">1 </span>
                  <span>Shipping address</span>
                </div>
                <div className="col-span-5 ">
                  <AddressDisplay address={shippingAddress} />
                </div>
                <div className="col-span-2">
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      setIsAddressSelected(false);
                      setShowAddressForm(true);
                      // Reset form to current shipping address for editing
                      shippingAddressForm.reset(shippingAddress);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex text-primary text-lg font-bold my-2">
                  <span className="w-8">1 </span>
                  <span>
                    {userHasSavedAddress ? "Confirm shipping address" : "Enter shipping address"}
                  </span>
                </div>

                {(userHasSavedAddress || hasCompleteShippingAddress) && !showAddressForm ? (
                  // Show saved address or complete shipping address with option to use it or change it
                  <Card className="md:ml-8 my-4">
                    <CardContent className="p-4 space-y-2">
                      <div className="text-lg font-bold mb-2">
                        {userHasSavedAddress ? "Your saved address" : "Current shipping address"}
                      </div>
                      <AddressDisplay address={(userHasSavedAddress ? fullUser.address : shippingAddress) as CambodiaAddress} />
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            const addressToUse = userHasSavedAddress ? fullUser.address : shippingAddress;
                            setShippingAddress(addressToUse as CambodiaAddress);
                            setIsAddressSelected(true);
                          }}
                          className="rounded-full font-bold"
                        >
                          Use this address
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Reset form to allow editing and show form
                            shippingAddressForm.reset(emptyAddressValues);
                            setShowAddressForm(true);
                          }}
                          className="rounded-full"
                        >
                          Use different address
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Show address form for users without saved address
                  <Form {...shippingAddressForm}>
                    <form
                      method="post"
                      onSubmit={shippingAddressForm.handleSubmit(
                        onSubmitShippingAddress
                      )}
                      className="space-y-4"
                    >
                      <Card className="md:ml-8 my-4">
                        <CardContent className="p-4 space-y-2">
                          <div className="text-lg font-bold mb-2">
                            Your address
                          </div>

                          <CambodiaAddressForm control={shippingAddressForm.control} setValue={shippingAddressForm.setValue} />
                        </CardContent>
                        <CardFooter className="p-4">
                          <Button
                            type="submit"
                            className="rounded-full font-bold"
                          >
                            Ship to this address
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>
                  </Form>
                )}


              </>
            )}
          </div>
          {/* payment method */}
          <div className="border-y">
            {isPaymentMethodSelected && paymentMethod ? (
              <div className="grid  grid-cols-1 md:grid-cols-12  my-3 pb-3">
                <div className="flex text-lg font-bold  col-span-5">
                  <span className="w-8">2 </span>
                  <span>Payment Method</span>
                </div>
                <div className="col-span-5 ">
                  <p>{paymentMethod}</p>
                </div>
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPaymentMethodSelected(false);
                      if (paymentMethod) setIsDeliveryDateSelected(true);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isAddressSelected ? (
              <>
                <div className="flex text-primary text-lg font-bold my-2">
                  <span className="w-8">2 </span>
                  <span>Choose a payment method</span>
                </div>
                <Card className="md:ml-8 my-4">
                  <CardContent className="p-4">
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value)}
                    >
                      {filteredPaymentMethods.map((pm) => (
                        <div key={pm.name} className="flex items-center py-1 ">
                          <RadioGroupItem
                            value={pm.name}
                            id={`payment-${pm.name}`}
                          />
                          <Label
                            className="font-bold pl-2 cursor-pointer"
                            htmlFor={`payment-${pm.name}`}
                          >
                            {pm.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="p-4">
                    <Button
                      onClick={handleSelectPaymentMethod}
                      className="rounded-full font-bold"
                    >
                      Use this payment method
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className="flex text-muted-foreground text-lg font-bold my-4 py-3">
                <span className="w-8">2 </span>
                <span>Choose a payment method</span>
              </div>
            )}
          </div>
          {/* items and delivery date */}
          <div>
            {isDeliveryDateSelected && deliveryDateIndex != undefined ? (
              <div className="grid  grid-cols-1 md:grid-cols-12  my-3 pb-3">
                <div className="flex text-lg font-bold  col-span-5">
                  <span className="w-8">3 </span>
                  <span>Items and shipping</span>
                </div>
                <div className="col-span-5">
                  <p>
                    Delivery date:{" "}
                    {
                      formatDateTime(
                        calculateFutureDate(
                          availableDeliveryDates[deliveryDateIndex]
                            .daysToDeliver
                        )
                      ).dateOnly
                    }
                  </p>
                  <ul>
                    {items.map((item, _index) => (
                      <li key={_index}>
                        {item.name} x {item.quantity} = {item.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-2">
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      setIsPaymentMethodSelected(true);
                      setIsDeliveryDateSelected(false);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isPaymentMethodSelected && isAddressSelected ? (
              <>
                <div className="flex text-primary  text-lg font-bold my-2">
                  <span className="w-8">3 </span>
                  <span>Review items and shipping</span>
                </div>
                <Card className="md:ml-8">
                  <CardContent className="p-4">
                    <p className="mb-2">
                      <span className="text-lg font-bold text-green-700">
                        Arriving{" "}
                        {
                          formatDateTime(
                            calculateFutureDate(
                              availableDeliveryDates[deliveryDateIndex!]
                                .daysToDeliver
                            )
                          ).dateOnly
                        }
                      </span>{" "}
                      If you order in the next {timeUntilMidnight().hours} hours
                      and {timeUntilMidnight().minutes} minutes.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        {items.map((item, _index) => (
                          <div key={_index} className="flex gap-4 py-2">
                            <div className="relative w-16 h-16">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="20vw"
                                style={{
                                  objectFit: "contain",
                                }}
                              />
                            </div>

                            <div className="flex-1">
                              <p className="font-semibold">
                                {item.name}, {item.color}, {item.size}
                              </p>
                              <p className="font-bold">
                                <ProductPrice price={item.price} plain />
                              </p>

                              <Select
                                value={item.quantity.toString()}
                                onValueChange={(value) => {
                                  if (value === "0") removeItem(item);
                                  else updateItem(item, Number(value));
                                }}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue>
                                    Qty: {item.quantity}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {Array.from({
                                    length: item.countInStock,
                                  }).map((_, i) => (
                                    <SelectItem key={i + 1} value={`${i + 1}`}>
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                  <SelectItem key="delete" value="0">
                                    Delete
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className=" font-bold">
                          <p className="mb-2"> Choose a shipping speed:</p>

                          <ul>
                            <RadioGroup
                              value={
                                availableDeliveryDates[deliveryDateIndex!].name
                              }
                              onValueChange={(value) =>
                                setDeliveryDateIndex(
                                  availableDeliveryDates.findIndex(
                                    (address) => address.name === value
                                  )!
                                )
                              }
                            >
                              {availableDeliveryDates.map((dd) => (
                                <div key={dd.name} className="flex">
                                  <RadioGroupItem
                                    value={dd.name}
                                    id={`address-${dd.name}`}
                                  />
                                  <Label
                                    className="pl-2 space-y-2 cursor-pointer"
                                    htmlFor={`address-${dd.name}`}
                                  >
                                    <div className="text-green-700 font-semibold">
                                      {
                                        formatDateTime(
                                          calculateFutureDate(dd.daysToDeliver)
                                        ).dateOnly
                                      }
                                    </div>
                                    <div>
                                      {(dd.freeShippingMinPrice > 0 &&
                                      itemsPrice >= dd.freeShippingMinPrice
                                        ? 0
                                        : dd.shippingPrice) === 0 ? (
                                        "FREE Shipping"
                                      ) : (
                                        <ProductPrice
                                          price={dd.shippingPrice}
                                          plain
                                        />
                                      )}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex text-muted-foreground text-lg font-bold my-4 py-3">
                <span className="w-8">3 </span>
                <span>Items and shipping</span>
              </div>
            )}
          </div>
          {isPaymentMethodSelected && isAddressSelected && (
            <div className="mt-6">
              <div className="block md:hidden">
                <CheckoutSummary />
              </div>

              <Card className="hidden md:block ">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-3">
                  <Button onClick={handlePlaceOrder} className="rounded-full">
                    Place Your Order
                  </Button>
                  <div className="flex-1">
                    <p className="font-bold text-lg">
                      Order Total: <ProductPrice price={totalPrice} plain />
                    </p>
                    <p className="text-xs">
                      {" "}
                      By placing your order, you agree to {
                        site.name
                      }&apos;s{" "}
                      <Link href="/page/privacy-policy">privacy notice</Link>{" "}
                      and
                      <Link href="/page/conditions-of-use">
                        {" "}
                        conditions of use
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <CheckoutFooter />
        </div>
        <div className="hidden md:block">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  );
};
export default CheckoutForm;
