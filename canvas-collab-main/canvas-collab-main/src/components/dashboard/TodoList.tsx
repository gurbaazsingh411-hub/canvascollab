import { useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TodoList() {
    const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos();
    const [newTodo, setNewTodo] = useState("");

    const handleCreate = async () => {
        if (!newTodo.trim()) return;
        try {
            await createTodo.mutateAsync(newTodo);
            setNewTodo("");
        } catch (error) {
            console.error("Failed to create todo", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCreate();
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    My Tasks
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a new task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8"
                    />
                    <Button size="sm" onClick={handleCreate} disabled={!newTodo.trim() || createTodo.isPending}>
                        {createTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : todos?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Stay organized!</p>
                    ) : (
                        todos?.map((todo) => (
                            <div key={todo.id} className="group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Checkbox
                                        checked={todo.completed}
                                        onCheckedChange={(checked) => toggleTodo.mutate({ id: todo.id, completed: checked as boolean })}
                                    />
                                    <span className={cn("text-sm truncate transition-all", todo.completed && "text-muted-foreground line-through")}>
                                        {todo.content}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                    onClick={() => deleteTodo.mutate(todo.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
