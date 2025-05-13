import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { blinkFormSchema } from "@/schema/blink-form-schema";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    // İstek gövdesini al ve logla
    const body = await request.json();

    try {
      // Veriyi doğrula
      const validatedData = blinkFormSchema.parse(body);

      // isCustomInput'u boolean olarak zorla
      const isCustomInput = Boolean(validatedData.isCustomInput);

      // Veritabanına kaydet
      const blink = await prisma.blink.create({
        data: {
          title: validatedData.title,
          imageUrl: validatedData.image_url,
          description: validatedData.description,
          label: validatedData.label,
          isCustomInput,
          userId: session.user.id,
          amounts: {
            create: validatedData.amount.map((amount) => ({
              value: amount.value,
            })),
          },
        },
        include: {
          amounts: true,
          user: true,
        },
      });

      return NextResponse.json(blink);
    } catch (validationError) {
      console.error("Validation error:", validationError);

      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }

      // Special handling for Prisma errors
      if (validationError instanceof Error) {
        return NextResponse.json(
          {
            error: "Database operation error",
            message: validationError.message,
          },
          { status: 500 }
        );
      }

      throw validationError;
    }
  } catch (error) {
    console.error("Unexpected error:", error);

    return NextResponse.json(
      {
        error: "Server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You need to be logged in" },
        { status: 401 }
      );
    }

    const user = session.user;

    if (!user.id) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 400 }
      );
    }

    const blinks = await prisma.blink.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(blinks);
  } catch (error) {
    console.error("Error fetching blinks:", error);
    return NextResponse.json(
      { error: "Error fetching blinks" },
      { status: 500 }
    );
  }
}
