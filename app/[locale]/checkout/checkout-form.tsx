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
import { useEffect, useState, useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import CheckoutFooter from "./checkout-footer";
import { ShippingAddress, CambodiaAddress } from "@/types";
import useIsMounted from "@/hooks/use-is-mounted";
import Link from "next/link";
import useUserCart from "@/hooks/use-user-cart";
import useSettingStore from "@/hooks/use-setting-store";
import ProductPrice from "@/components/shared/product/product-price";
import OrderSummary from "@/components/shared/cart/order-summary";
import { useAuthSession } from "@/hooks/use-auth-session";
import { IUser } from "@/lib/db/models/user.model";
import CheckoutStepper, { Step, StepStatus } from "@/components/shared/checkout/checkout-stepper";
import { MapPin, CreditCard, Package, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Clean default values for address form (no pre-fill data)
const emptyAddressValues = {
  fullName: "",
  phone: "",
  provinceId: 0,
  districtId: 0,
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

  // Normalize address to ensure all fields have defined values (no undefined)
  const normalizeAddress = (address: Partial<CambodiaAddress> | null | undefined): CambodiaAddress => {
    return {
      fullName: address?.fullName || "",
      phone: address?.phone || "",
      provinceId: address?.provinceId || 0,
      districtId: address?.districtId || 0,
      communeCode: address?.communeCode || "",
      houseNumber: address?.houseNumber || "",
      street: address?.street || "",
      postalCode: address?.postalCode || "",
      provinceName: address?.provinceName || "",
      districtName: address?.districtName || "",
      communeName: address?.communeName || "",
    };
  };

  // Determine the default values for the form
  const getDefaultAddressValues = (): CambodiaAddress => {
    // If there's already a shipping address in cart, use it
    if (shippingAddress) {
      return normalizeAddress(shippingAddress);
    }
    // Otherwise use empty values
    return emptyAddressValues;
  };

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(CambodiaAddressSchema),
    defaultValues: getDefaultAddressValues(),
  });

  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);

  // Filter payment methods based on shipping address province
  const filteredPaymentMethods = useMemo(() => {
    const provinceName = shippingAddress && 'provinceName' in shippingAddress ? shippingAddress.provinceName : (shippingAddress && 'province' in shippingAddress ? shippingAddress.province : null);
    
    if (!provinceName) {
      // No address yet, show all methods
      return availablePaymentMethods;
    }
    
    // Check if address is in Phnom Penh or province
    const isPhnomPenh = provinceName.toLowerCase().includes('phnom penh') || 
                        provinceName.toLowerCase().includes('ភ្នំពេញ');
    
    const filtered = availablePaymentMethods.filter((pm) => {
      // Province (not Phnom Penh): Only show ABA PayWay
      if (!isPhnomPenh) {
        return pm.name === "ABA PayWay" && abaPayWay?.enabled && abaPayWay?.merchantId;
      }
      
      // Phnom Penh: Show all payment methods (with ABA PayWay only if configured)
      if (pm.name === "ABA PayWay") {
        return abaPayWay?.enabled && abaPayWay?.merchantId;
      }
      return true; // Show all other payment methods for Phnom Penh
    });
    
    return filtered;
  }, [availablePaymentMethods, shippingAddress, abaPayWay]);
  const isMounted = useIsMounted();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch user's default address when session user is available
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!sessionUser?.id) {
        setUserLoading(false);
        return;
      }

      try {
        const { getDefaultAddress } = await import('@/lib/actions/address.actions')
        const result = await getDefaultAddress()
        
        if (result.success && result.data) {
          setFullUser({ address: result.data } as any)
          
          // If cart doesn't have shipping address, use default
          if (!shippingAddress) {
            setShippingAddress(normalizeAddress(result.data))
          }
        } else {
          setFullUser(null)
        }
      } catch (error) {
        console.error('Failed to fetch default address:', error);
        setFullUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchDefaultAddress();
  }, [sessionUser?.id]);

  // Check if user has a complete default address
  const userHasDefaultAddress = fullUser?.address && isAddressComplete(fullUser.address as CambodiaAddress);

  // Also check if there's a complete address in the cart's shipping address
  const hasCompleteShippingAddress = shippingAddress && isAddressComplete(shippingAddress);

  // Callback to update shipping address in real-time as form changes
  const handleAddressFieldChange = (fieldName: string, value: any) => {
    if (fieldName === 'provinceName' && value) {
      // Update shippingAddress immediately when province name changes to filter payment methods
      const currentFormValues = shippingAddressForm.getValues();
      const updatedAddress = { ...currentFormValues, provinceName: value };
      setShippingAddress(updatedAddress);
      
      // Clear payment selection when province changes
      if (paymentMethod) {
        setPaymentMethod('');
        setIsPaymentMethodSelected(false);
      }
    }
  };

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    // Update shipping address in cart
    setShippingAddress(values);
    
    // Mark address as selected
    setIsAddressSelected(true);
    setShowAddressForm(false);
    
    // Clear payment method selection to force user to reselect with new address
    setPaymentMethod('');
    setIsPaymentMethodSelected(false);
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

  // Initialize shipping address from user's default address if available and no cart address exists
  useEffect(() => {
    if (!isMounted || !fullUser || userLoading) return;

    // If cart doesn't have shipping address but user has default address, use it
    if (!shippingAddress && userHasDefaultAddress) {
      setShippingAddress(normalizeAddress(fullUser.address as CambodiaAddress));
    }
  }, [isMounted, fullUser, userLoading, shippingAddress, userHasDefaultAddress, setShippingAddress]);

  // Update form when shipping address changes
  useEffect(() => {
    if (!isMounted || !shippingAddress) return;

    // Reset form with current shipping address (normalized to prevent undefined values)
    shippingAddressForm.reset(normalizeAddress(shippingAddress));
  }, [isMounted, shippingAddress, shippingAddressForm]);

  // Clear payment method if it's no longer available in filtered list (when province changes)
  useEffect(() => {
    if (!isMounted || !paymentMethod) return;

    // Check if currently selected payment method is still available
    const isPaymentMethodStillAvailable = filteredPaymentMethods.some(
      (pm) => pm.name === paymentMethod
    );

    // If not available, clear the selection and reset to payment step
    if (!isPaymentMethodStillAvailable) {
      console.log('Payment method no longer available, clearing:', paymentMethod);
      setPaymentMethod('');
      setIsPaymentMethodSelected(false);
    }
  }, [isMounted, filteredPaymentMethods, paymentMethod, setPaymentMethod]);

  // Initialize address selection state based on whether user has saved address
  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false);
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false);
  const [isDeliveryDateSelected, setIsDeliveryDateSelected] =
    useState<boolean>(false);

  // Calculate checkout steps
  const checkoutSteps: Step[] = useMemo(() => {
    const getStepStatus = (step: number): StepStatus => {
      if (step === 1) {
        return isAddressSelected ? 'completed' : 'active'
      }
      if (step === 2) {
        if (!isAddressSelected) return 'pending'
        return isPaymentMethodSelected ? 'completed' : 'active'
      }
      if (step === 3) {
        if (!isPaymentMethodSelected || !isAddressSelected) return 'pending'
        return 'active'
      }
      return 'pending'
    }

    return [
      {
        id: 1,
        label: 'Shipping',
        sublabel: 'Address',
        icon: MapPin,
        status: getStepStatus(1)
      },
      {
        id: 2,
        label: 'Payment',
        sublabel: 'Method',
        icon: CreditCard,
        status: getStepStatus(2)
      },
      {
        id: 3,
        label: 'Review',
        sublabel: '& Ship',
        icon: Package,
        status: getStepStatus(3)
      }
    ]
  }, [isAddressSelected, isPaymentMethodSelected]);

  // Initialize address selection state when component mounts
  useEffect(() => {
    if (!isMounted || userLoading) return;
    
    // If user has default address or complete shipping address, auto-select it
    if ((userHasDefaultAddress || hasCompleteShippingAddress) && shippingAddress) {
      setIsAddressSelected(true);
      setShowAddressForm(false);
    } else {
      // Show form for users without default address
      setIsAddressSelected(false);
      setShowAddressForm(true);
    }
  }, [isMounted, userLoading, userHasDefaultAddress, hasCompleteShippingAddress, shippingAddress]);

  const handlePlaceOrder = async () => {
    // Validate address before placing order
    if (!validateAddressForOrder()) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      const res = await createOrder({
        items,
        shippingAddress,
        expectedDeliveryDate: availableDeliveryDates &&
          deliveryDateIndex !== undefined &&
          availableDeliveryDates[deliveryDateIndex] &&
          availableDeliveryDates[deliveryDateIndex].daysToDeliver
          ? calculateFutureDate(availableDeliveryDates[deliveryDateIndex].daysToDeliver)
          : new Date(),
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
        setIsPlacingOrder(false);
      } else {
        toast({
          description: res.message,
          variant: "default",
        });
        // Navigate first, then clear cart to prevent UI flicker
        router.push(`/checkout/${res.data?.orderId}`);
        // Clear cart after a short delay to ensure navigation has started
        setTimeout(() => {
          clearCart();
        }, 100);
      }
    } catch (error) {
      toast({
        description: "An error occurred while placing your order. Please try again.",
        variant: "destructive",
      });
      setIsPlacingOrder(false);
    }
  };
  const handleSelectPaymentMethod = () => {
    // Validate that a payment method is actually selected
    if (!paymentMethod) {
      toast({
        description: "Please select a payment method before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that payment methods are available
    if (filteredPaymentMethods.length === 0) {
      toast({
        description: "No payment methods available. Please check your shipping address or contact support.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddressSelected(true);
    setIsPaymentMethodSelected(true);
  };

  // Helper text based on checkout step
  const getHelpText = () => {
    if (!isAddressSelected) {
      return "Choose a shipping address and payment method to calculate shipping and handling."
    }
    if (isAddressSelected && !isPaymentMethodSelected) {
      return "Choose a payment method to continue. You'll review your order before it's final."
    }
    return null
  };

  // Show loading state while user data is being fetched or placing order
  if (!isMounted || userLoading || isPlacingOrder) {
    return (
      <main className="max-w-6xl mx-auto highlight-link">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{isPlacingOrder ? 'Placing your order...' : 'Loading checkout...'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 highlight-link">
      {/* Checkout Stepper */}
      <div className="mb-8">
        <CheckoutStepper 
          steps={checkoutSteps}
          onStepClick={(stepId) => {
            if (stepId === 1 && isAddressSelected) {
              // Redirect to address management page instead
              router.push('/account/addresses')
            }
          }}
        />
      </div>

      <div className="grid md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-3">
          {/* shipping address */}
          <div>
            {isAddressSelected && shippingAddress ? (
              <Card className="my-4 rounded-lg border border-border">
                <CardContent className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">Shipping Address</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/account/addresses')}
                    >
                      Change
                    </Button>
                  </div>
                  <AddressDisplay address={shippingAddress} />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-lg font-bold my-4">
                  {userHasDefaultAddress ? "Confirm Shipping Address" : "Enter Shipping Address"}
                </div>

                {/* Show default address if user has one */}
                {!showAddressForm && (userHasDefaultAddress || hasCompleteShippingAddress) && (
                  <Card className="my-4 rounded-lg border border-border">
                    <CardContent className="p-4 md:p-6 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold">
                          {userHasDefaultAddress ? "Your default address" : "Current shipping address"}
                        </div>
                        {userHasDefaultAddress && (
                          <Badge variant="default" className="gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <AddressDisplay address={(userHasDefaultAddress ? fullUser.address : shippingAddress) as CambodiaAddress} />
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                          onClick={() => {
                            const addressToUse = userHasDefaultAddress ? fullUser.address : shippingAddress;
                            const normalizedAddress = normalizeAddress(addressToUse);
                            setShippingAddress(normalizedAddress);
                            setIsAddressSelected(true);
                          }}
                          size="lg"
                          className="w-full sm:w-auto font-bold"
                        >
                          Use this address
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => router.push('/account/addresses')}
                          className="w-full sm:w-auto"
                        >
                          Change address
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        You can add or edit your addresses in your <Link href="/account/addresses" className="text-primary hover:underline">account settings</Link>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Address form for users without default address */}
                {showAddressForm && (
                  <Form {...shippingAddressForm}>
                    <form
                      method="post"
                      onSubmit={shippingAddressForm.handleSubmit(onSubmitShippingAddress)}
                      className="space-y-4"
                    >
                      <Card className="my-4 rounded-lg border border-border">
                        <CardContent className="p-4 md:p-6 space-y-2">
                          <div className="text-lg font-bold mb-2">
                            Enter your delivery address
                          </div>

                          <CambodiaAddressForm 
                            control={shippingAddressForm.control} 
                            setValue={shippingAddressForm.setValue}
                            onFieldChange={handleAddressFieldChange}
                          />

                          <p className="text-xs text-muted-foreground pt-2">
                            This address will be used for this order only. To save it, go to <Link href="/account/addresses" className="text-primary hover:underline">address management</Link>
                          </p>
                        </CardContent>
                        <CardFooter className="p-4 md:p-6 pt-0">
                          <Button
                            type="submit"
                            size="lg"
                            className="font-bold"
                          >
                            Continue with this address
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
          <div className="my-4">
            {isPaymentMethodSelected && paymentMethod ? (
              <Card className="my-4 rounded-lg border border-border">
                <CardContent className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">Payment Method</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsPaymentMethodSelected(false);
                        if (paymentMethod) setIsDeliveryDateSelected(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{paymentMethod}</p>
                </CardContent>
              </Card>
            ) : isAddressSelected ? (
              <>
                <div className="text-lg font-bold my-4">
                  Choose Payment Method
                </div>
                <Card 
                  key={filteredPaymentMethods.map(pm => pm.name).join('-')}
                  className="my-4 rounded-lg border border-border"
                >
                  <CardContent className="p-4 md:p-6">
                    {filteredPaymentMethods.length === 0 ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="text-amber-600 font-semibold">
                          No payment methods available
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No payment methods are configured for your shipping address. 
                          {!(shippingAddress && ('provinceName' in shippingAddress ? shippingAddress.provinceName : ('province' in shippingAddress ? shippingAddress.province : null))) && " Please ensure your address includes a valid province."}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddressSelected(false);
                            setShowAddressForm(true);
                          }}
                        >
                          Update Shipping Address
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup
                        key={`radio-${filteredPaymentMethods.map(pm => pm.name).join('-')}`}
                        value={paymentMethod || ""}
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
                    )}
                  </CardContent>
                  {filteredPaymentMethods.length > 0 && (
                    <CardFooter className="p-4 md:p-6 pt-0">
                      <Button
                        onClick={handleSelectPaymentMethod}
                        size="lg"
                        className="font-bold"
                      >
                        Use this payment method
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </>
            ) : null}
          </div>
          {/* items and delivery date */}
          <div className="my-4">
            {isPaymentMethodSelected && isAddressSelected ? (
              <>
                <div className="text-lg font-bold my-4">
                  Review Items & Shipping
                </div>
                <Card className="my-4 rounded-lg border border-border">
                  <CardContent className="p-4 md:p-6">
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
                                availableDeliveryDates &&
                                deliveryDateIndex !== undefined &&
                                availableDeliveryDates[deliveryDateIndex]
                                  ? availableDeliveryDates[deliveryDateIndex].name
                                  : ""
                              }
                              onValueChange={(value) =>
                                setDeliveryDateIndex(
                                  availableDeliveryDates?.findIndex(
                                    (address) => address.name === value
                                  ) ?? 0
                                )
                              }
                            >
                              {availableDeliveryDates?.map((dd) => (
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
                                      {dd.shippingPrice === 0 ? (
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
            ) : null}
          </div>
          <CheckoutFooter />
        </div>
        <div>
          <OrderSummary
            itemsPrice={itemsPrice}
            shippingPrice={shippingPrice}
            taxPrice={taxPrice}
            totalPrice={totalPrice}
            discountAmount={discountAmount}
            showCoupon={true}
            showPlaceOrderButton={isPaymentMethodSelected && isAddressSelected}
            placeOrderButtonOnClick={handlePlaceOrder}
            placeOrderButtonDisabled={isPlacingOrder}
            helpText={getHelpText()}
            siteName={site.name}
            sticky={true}
          />
        </div>
      </div>
    </main>
  );
};
export default CheckoutForm;
