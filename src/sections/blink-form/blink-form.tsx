"use client";

import { Form } from "@/components/hook-form/form-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlinkFormSchema } from "@/schema/blink-form-schema";
import { blinkFormSchema } from "@/schema/blink-form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { CopyButton } from "@/components/ui/copy-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletButton } from "@/components/solana/solana-provider";
import { CONFIG } from "@/constant/config";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const steps = [
  {
    id: "details",
    title: "Donation Details",
    fields: ["title", "image_url", "description", "label"],
  },
  {
    id: "amounts",
    title: "Donation Amount",
    fields: ["amount", "isCustomInput"],
  },
];

const defaultValues = {
  title: "",
  image_url: "",
  description: "",
  label: "",
  amount: [{ value: 0.1 }],
  isCustomInput: false,
} as unknown as BlinkFormSchema;

// Form animasyonları için framer-motion değerlerini güncelle
const pageTransition = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

const successTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, delay: 0.8, ease: "easeOut" },
};

const PLATFORM_WALLET = new PublicKey("GkgDke8NYrdw7H8HFRyouwSzJ1Nxu3LTnpYu83SEJWDn");
const PLATFORM_FEE = 0.001; // 0.001 SOL

export default function BlinkForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const { publicKey, signTransaction } = useWallet();
  const { data: session } = useSession();
  const { connection } = useConnection();

  const methods = useForm<BlinkFormSchema>({
    resolver: zodResolver(blinkFormSchema),
    defaultValues,
    mode: "all",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    control,
    setValue,
  } = methods;

  const {
    fields: amountFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "amount",
  });

  const handleNext = async () => {
    const fieldsToValidate = steps[currentStep]
      .fields as (keyof BlinkFormSchema)[];
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet!");
      return;
    }

    if (currentStep !== steps.length - 1) {
      await handleNext();
      return;
    }

    try {
      // Create and send platform fee transaction first
      const platformFeeInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: PLATFORM_FEE * LAMPORTS_PER_SOL,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(platformFeeInstruction);

      try {
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
        toast.success("Platform fee paid successfully!");
      } catch (error) {
        console.error("Platform fee transaction error:", error);
        toast.error("Failed to pay platform fee. Please try again.");
        return;
      }

      // Form verilerini API'nin beklediği formata dönüştür
      const formattedData = {
        ...data,
        amount: data.amount.map((item) => ({
          value: Number(item.value),
        })),
        isCustomInput: Boolean(data.isCustomInput),
      };

      console.info("Sending data:", formattedData);

      // Veritabanına kaydet
      const response = await fetch("/api/blinks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.details) {
          const errorMessage = responseData.details
            .map((err: any) => err.message)
            .join(", ");
          throw new Error(errorMessage);
        }
        throw new Error(
          responseData.error || "Error occurred while creating donation"
        );
      }

      const dummyLink = `${CONFIG.baseUrl}/api/actions/transfer-sol/${responseData.id}`;
      setGeneratedLink(dummyLink);
      setIsSuccess(true);
      toast.success("Donation created successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "An error occurred!"
      );
    }
  });

  const handleAddAmount = () => {
    append({ value: 0 });
  };

  const handleRemoveAmount = (index: number) => {
    remove(index);
  };

  if (isSuccess) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-background/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0">
          <AnimatedGridPattern
            numSquares={30}
            maxOpacity={0.1}
            duration={3}
            repeatDelay={1}
            width={40}
            height={40}
            className={cn(
              "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-[-30%] h-[160%]",
              "opacity-70 dark:opacity-50",
              "skew-y-12 transform"
            )}
          />
        </div>

        <div className="w-full max-w-2xl mx-auto p-4">
          <motion.div {...successTransition}>
            <Card className="relative bg-background/60 backdrop-blur-[8px] rounded-xl p-6 md:p-8">
              <div className="text-center space-y-6">
                {/* Success Icon */}
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 1.2,
                  }}
                >
                  <div className="rounded-full bg-green-100 p-3">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                >
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground/90 to-foreground bg-clip-text text-transparent">
                    Congratulations!
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Your donation has been created successfully
                  </p>
                </motion.div>

                {/* Generated Link */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.8 }}
                >
                  <Label className="text-base font-medium">
                    Your Donation Link
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={generatedLink}
                      className="h-14 text-lg bg-background/50 border-muted"
                    />
                    <CopyButton value={generatedLink} />
                  </div>
                </motion.div>

                {/* Create New Token Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 2.1 }}
                >
                  <RainbowButton
                    onClick={() => {
                      setIsSuccess(false);
                      setCurrentStep(0);
                      methods.reset(defaultValues);
                    }}
                    className="mt-6"
                  >
                    Create Another Donation
                  </RainbowButton>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!publicKey && !session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/30">
        <div className="absolute inset-0">
          <AnimatedGridPattern
            numSquares={30}
            maxOpacity={0.1}
            duration={3}
            repeatDelay={1}
            width={40}
            height={40}
            className={cn(
              "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-[-30%] h-[160%]",
              "opacity-70 dark:opacity-50",
              "skew-y-12 transform"
            )}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold">Please connect your wallet</h2>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/30">
      <div className="absolute inset-0">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          width={40}
          height={40}
          className={cn(
            "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[160%]",
            "opacity-70 dark:opacity-50",
            "skew-y-12 transform"
          )}
        />
      </div>

      <div className="w-full max-w-2xl mx-auto p-4">
        <Card className="relative bg-background/60 backdrop-blur-[12px] rounded-xl p-6 md:p-8">
          <div className="text-center mb-12">
            <motion.h1
              className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground/90 to-foreground/60 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {steps[currentStep].title}
            </motion.h1>
          </div>

          <Form methods={methods} onSubmit={onSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                {...pageTransition}
                className="space-y-8"
              >
                {currentStep === 0 && (
                  <>
                    <div className="space-y-6">
                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Label className="text-base font-medium mb-2 block">
                            Title
                          </Label>
                          <Input
                            placeholder="Enter title"
                            {...register("title")}
                            className="h-14 text-lg bg-background/50 border-muted backdrop-blur-sm transition-all hover:bg-background/70 focus:ring-2 focus:ring-primary/20"
                          />
                          {errors.title && (
                            <motion.p
                              className="text-sm text-destructive mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {errors.title.message}
                            </motion.p>
                          )}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label className="text-base font-medium mb-2 block">
                            Image URL
                          </Label>
                          <Input
                            placeholder="Enter image URL"
                            {...register("image_url")}
                            className="h-14 text-lg bg-background/50 border-muted backdrop-blur-sm transition-all hover:bg-background/70 focus:ring-2 focus:ring-primary/20"
                          />
                          {errors.image_url && (
                            <motion.p
                              className="text-sm text-destructive mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {errors.image_url.message}
                            </motion.p>
                          )}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label className="text-base font-medium mb-2 block">
                            Description
                          </Label>
                          <Input
                            placeholder="Enter description"
                            {...register("description")}
                            className="h-14 text-lg bg-background/50 border-muted backdrop-blur-sm transition-all hover:bg-background/70 focus:ring-2 focus:ring-primary/20"
                          />
                          {errors.description && (
                            <motion.p
                              className="text-sm text-destructive mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {errors.description.message}
                            </motion.p>
                          )}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label className="text-base font-medium mb-2 block">
                            Label
                          </Label>
                          <Input
                            placeholder="Enter label"
                            {...register("label")}
                            className="h-14 text-lg bg-background/50 border-muted backdrop-blur-sm transition-all hover:bg-background/70 focus:ring-2 focus:ring-primary/20"
                          />
                          {errors.label && (
                            <motion.p
                              className="text-sm text-destructive mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {errors.label.message}
                            </motion.p>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Amount</Label>
                    </div>

                    <div className="space-y-4">
                      {amountFields.map((field, index) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder="Miktar giriniz"
                                step="0.1"
                                min="0.1"
                                {...register(`amount.${index}.value`, {
                                  valueAsNumber: true,
                                  required: "Miktar gerekli",
                                  min: {
                                    value: 0.1,
                                    message: "Miktar 0'dan büyük olmalı",
                                  },
                                })}
                                className="h-14 text-lg bg-background/50 border-muted backdrop-blur-sm transition-all hover:bg-background/70 focus:ring-2 focus:ring-primary/20"
                              />
                              {errors.amount?.[index]?.value && (
                                <motion.p
                                  className="text-sm text-destructive mt-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  {errors.amount[index]?.value?.message}
                                </motion.p>
                              )}
                            </div>
                            {amountFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleRemoveAmount(index)}
                                className="h-14 w-14 shrink-0"
                              >
                                <span className="text-2xl">−</span>
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {amountFields.length < 3 && (
                      <Button
                        type="button"
                        onClick={handleAddAmount}
                        variant="outline"
                        className="w-full h-14 text-lg"
                      >
                        Add Amount +
                      </Button>
                    )}
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Checkbox
                        id="isCustomInput"
                        checked={methods.watch("isCustomInput")}
                        onCheckedChange={(checked) => {
                          methods.setValue("isCustomInput", checked === true);
                        }}
                      />
                      <label
                        htmlFor="isCustomInput"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I want to create a custom amount
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="flex justify-between mt-8 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {currentStep > 0 && (
                <InteractiveHoverButton
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  isBack
                >
                  Back
                </InteractiveHoverButton>
              )}

              <div className={currentStep === 0 ? "ml-auto" : ""}>
                <InteractiveHoverButton
                  type="button"
                  onClick={
                    currentStep === steps.length - 1 ? onSubmit : handleNext
                  }
                  disabled={isSubmitting}
                >
                  {currentStep === steps.length - 1
                    ? isSubmitting
                      ? "Submitting..."
                      : "Complete"
                    : "Next"}
                </InteractiveHoverButton>
              </div>
            </motion.div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
