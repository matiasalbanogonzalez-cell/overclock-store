"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Sends the form to a server action WITHOUT React's automatic reset.
 * With <form action={...}> React clears the fields after each submit, and on a
 * validation error the user would lose everything they typed.
 */
export function submitWithoutReset(dispatch: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
}
