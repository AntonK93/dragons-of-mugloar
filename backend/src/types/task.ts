interface Task {
    name: string;
    run: () => Promise<void>;
}
export type Tasks = Task[];
